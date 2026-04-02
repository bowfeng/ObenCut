/**
 * ComfyUI AI Provider Implementation
 * Uses ComfyUI with workflow JSON files for generation
 */

import {
  AIProvider,
  AIGenerationType,
  GenerationParameters,
  GenerationResult,
  GenerationTask,
} from "../ai-provider-factory-types";
import { getComfyUIManager, closeComfyUIManager } from "../comfyui/comfyui-manager";
import type { ComfyUIServerConfig } from "../comfyui/comfyui-wrapper";
import { ComfyUIWrapper } from "../comfyui/comfyui-wrapper";

export interface ComfyUIConfig {
  host: string;
  port: number;
  protocol: "http" | "https";
}

function getComfyUIConfig(): ComfyUIConfig {
  return {
    host: "localhost",
    port: 8188,
    protocol: (process.env.NEXT_PUBLIC_COMFYUI_PROTOCOL as "http" | "https") || "http",
  };
}

export class ComfyUIProvider implements AIProvider {
  id = "comfyui";
  name = "ComfyUI";
  description = "Local AI generation using ComfyUI workflows";

  private wrapper: ComfyUIWrapper | null = null;
  private tasks: Map<string, GenerationTask> = new Map();
  private config: ComfyUIConfig;

  // Supported generation types based on available workflows
  capabilities: AIGenerationType[] = [
    "text2image",
    "text2video",
    "image2video",
    "image2image",
  ];

  constructor(config?: ComfyUIConfig) {
    // If config is provided, use it; otherwise load from environment
    const actualConfig: ComfyUIServerConfig = {
      host: config?.host || "localhost",
      port: config?.port || 8188,
      protocol: config?.protocol || "http",
    };
    this.config = config || getComfyUIConfig();
    console.log(`[ComfyUIProvider] Creating wrapper with config:`, actualConfig);
  }

  async initialize(): Promise<void> {
    console.log(`[ComfyUIProvider] Initializing...`);
    try {
      this.wrapper = await getComfyUIManager(this.config);
      console.log(`[ComfyUIProvider] Wrapper created successfully`);
    } catch (error) {
      console.error(`[ComfyUIProvider] Failed to create wrapper:`, error);
      throw new Error(`ComfyUIProvider initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async isReady(): Promise<boolean> {
    if (!this.wrapper) {
      console.warn("[ComfyUIProvider] isReady called on uninitialized wrapper");
      return false;
    }
    return this.wrapper.isConnected() ?? false;
  }

  async generate(
    type: AIGenerationType,
    parameters: GenerationParameters,
    onProgress?: (progress: number) => void
  ): Promise<GenerationResult> {
    // Validate input
    if (!type) {
      throw new Error("Generation type is required");
    }

    if (!this.capabilities.includes(type)) {
      throw new Error(`ComfyUI does not support ${type}`);
    }

    // Validate wrapper
    if (!this.wrapper) {
      throw new Error("ComfyUIProvider is not initialized");
    }

    if (!await this.wrapper.isConnected()) {
      throw new Error("ComfyUI connection is not established");
    }

    // Create task
    const taskId = `comfyui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: GenerationTask = {
      taskId,
      generationType: type,
      providerId: this.id,
      parameters,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);

    try {
      // Update status to processing
      this.updateTaskStatus(taskId, "processing", 0);

      // Execute workflow
      const wrapperResult = await this.wrapper.executeWorkflow(type, parameters, onProgress);

      // Transform wrapper result to expected type
      const result: GenerationResult = {
        type,
        base64Url: wrapperResult.base64Url,
        promptId: wrapperResult.promptId,
      };

      // Update task with result
      this.updateTaskStatus(taskId, "completed", 100, undefined, result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Generation failed";
      this.updateTaskStatus(taskId, "failed", 0, errorMessage);
      throw error;
    }
  }

  getTask(taskId: string): GenerationTask | undefined {
    return this.tasks.get(taskId);
  }

  async cancelTask(taskId: string): Promise<void> {
    console.log(`[ComfyUIProvider] Canceling task: ${taskId}`);
    // Implementation depends on your needs
    // For now, just mark as failed
    const task = this.tasks.get(taskId);
    if (task) {
      this.updateTaskStatus(taskId, "failed", 0, "Cancelled by user");
    }
    await this.wrapper?.close();
  }

  configure(config: Record<string, any>): void {
    console.log(`[ComfyUIProvider] Configuring with:`, config);
    // Implementation depends on your needs
  }

  getConfig(): Record<string, any> {
    return {
      host: this.config.host,
      port: this.config.port,
      protocol: this.config.protocol || "http",
    };
  }

  async disconnect(): Promise<void> {
    console.log(`[ComfyUIProvider] Disconnecting...`);
    if (this.wrapper) {
      await this.wrapper.close();
      this.wrapper = null;
    }
    this.tasks.clear();
  }

  async dispose(): Promise<void> {
    await this.disconnect();
    await closeComfyUIManager();
  }

  private updateTaskStatus(
    taskId: string,
    status: GenerationTask["status"],
    progress: number,
    errorMessage?: string,
    result?: GenerationResult
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, {
        ...task,
        status,
        progress,
        errorMessage,
        result,
        completedAt: status === "completed" || status === "failed" ? new Date() : task.completedAt,
      });
    }
  }
}

export default ComfyUIProvider;
