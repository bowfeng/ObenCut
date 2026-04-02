/**
 * ComfyUI Wrapper using @stable-canvas/comfyui-client
 * Loads and executes predefined workflows from JSON files
 */

import { Client } from "@stable-canvas/comfyui-client";
import { workflowLoader } from "./workflow-loader";

// Constants
const DEFAULT_TIMEOUT_MS = 900_000; // 15 minutes for generation tasks
const POLL_INTERVAL_MS = 2_000;
const IMAGE_FETCH_TIMEOUT_MS = 30_000;
const MAX_HISTORY_ENTRIES = 50;

export interface ComfyUIServerConfig {
  host: string;
  port: number;
  protocol: "http" | "https";
  timeout?: number;
  ssl?: boolean;
}

export interface GenerationResult {
  base64Url: string;
  promptId: string;
  mediaType?: 'image' | 'video';
  mimeType?: string;
}

export interface GenerateImageOptions {
  prompt: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  cfgScale?: number;
  negativePrompt?: string;
}

export class ComfyUIWrapper {
  private client: Client;
  private baseUrl: string;
  private isConnectedFlag = false;
  private readonly timeoutMs: number;

  constructor(config: ComfyUIServerConfig, client?: Client) {
    this.baseUrl = `${config.protocol}://${config.host}:${config.port}`;
    this.timeoutMs = config.timeout ?? DEFAULT_TIMEOUT_MS;

    const clientConfig: Record<string, unknown> = {
      api_host: `${config.host}:${config.port}`,
      api_base: "",
    };

    if (config.ssl !== undefined) {
      clientConfig.ssl = config.ssl;
    }

    this.client = client ?? new Client(clientConfig);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.isConnectedFlag = true;
  }

  async isConnected(): Promise<boolean> {
    // Client may not have a connected() method, so we track it internally
    return this.isConnectedFlag;
  }

  async close(): Promise<void> {
    try {
      this.client.close();
      this.isConnectedFlag = false;
    } catch (error) {
      console.warn("[ComfyUIWrapper] Error closing client:", error);
    }
  }

  /**
   * Upload an image file to ComfyUI's input directory
   * Uses the /api/comfyui/upload proxy to avoid CORS issues
   */
  private async uploadImageToComfyUI(
    file: File,
  ): Promise<{ filename: string; subfolder: string; type: string }> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("overwrite", "true");

    // Use the API route proxy to avoid CORS issues
    const response = await fetch("/api/comfyui/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to upload image: ${errorData.error || response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  }

  /**
   * Execute a workflow, optionally uploading an image first for image2video tasks
   */
  async executeWorkflow(
    workflowId: string,
    parameters: Record<string, unknown>,
    onProgress?: (progress: number) => void,
  ): Promise<GenerationResult & { mediaType?: 'image' | 'video' }> {
    const workflowData = await workflowLoader.load(workflowId);
    
    // For image2video, upload the source image first
    let uploadedImageFilename: string | undefined;
    if (workflowId === "image2video" && parameters.sourceImage) {
      const uploadResult = await this.uploadImageToComfyUI(
        parameters.sourceImage as File
      );
      uploadedImageFilename = uploadResult.filename;
      
      // Update the LoadImage node with the uploaded filename
      const imageLoadNodeId = "269"; // LoadImage node ID in image2video workflow
      if (workflowData[imageLoadNodeId]) {
        workflowData[imageLoadNodeId].inputs.image = uploadedImageFilename;
      }
      
      console.log(`[ComfyUIWrapper] Uploaded image: ${uploadedImageFilename}`);
    }
    
    const injectedWorkflow = this.injectParameters(workflowData, parameters);
    return this.enqueueWithProgress(injectedWorkflow, onProgress);
  }

  /**
   * Queue a workflow and poll for completion
   */
  private async enqueueWithProgress(
    workflow: unknown,
    onProgress?: (progress: number) => void,
  ): Promise<GenerationResult> {
    const queueResult = await this.queuePrompt(workflow);
    const promptId = queueResult.prompt_id;

    console.log(`[ComfyUIWrapper] Workflow queued with prompt_id: ${promptId}`);

    return this.waitForCompletion(promptId, onProgress);
  }

  /**
   * Queue a workflow with the ComfyUI API
   */
  private async queuePrompt(workflow: unknown): Promise<{ prompt_id: string }> {
    const result = await this.client.queuePrompt(-1, { prompt: workflow, workflow });

    if (!result || !("prompt_id" in result) || !result.prompt_id) {
      const errorMessage = this.extractErrorMessage(result);
      console.error("[ComfyUIWrapper] Queue failed:", errorMessage);
      throw new Error(`Failed to queue workflow: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Poll until workflow is complete
   */
  private async waitForCompletion(
    promptId: string,
    onProgress?: (progress: number) => void,
  ): Promise<GenerationResult & { mediaType?: 'image' | 'video' }> {
    const startTime = Date.now();
    let hasRunning = true;

    while (hasRunning) {
      const elapsed = Date.now() - startTime;

      if (elapsed > this.timeoutMs) {
        throw new Error(
          "Generation timeout. Task may still be running on the server.",
        );
      }

      hasRunning = await this.checkHasRunningTask();

      if (hasRunning) {
        await this.delay(POLL_INTERVAL_MS);
        onProgress?.(Math.min(50, Math.floor((elapsed / this.timeoutMs) * 50)));
      }
    }

    onProgress?.(80);
    return this.findResult(promptId);
  }

  /**
   * Check if there are any running or pending tasks
   */
  private async checkHasRunningTask(): Promise<boolean> {
    const queue = await this.client.getQueue();
    const hasRunning =
      (queue?.Running?.length ?? 0) > 0 || (queue?.Pending?.length ?? 0) > 0;
    return hasRunning;
  }

  /**
   * Find generated result from history
   */
  private async findResult(promptId: string): Promise<GenerationResult & { mediaType?: 'image' | 'video' }> {
    const { History: recentHistory } = await this.client.getHistory(MAX_HISTORY_ENTRIES);

    console.log(
      `[ComfyUIWrapper] Checking ${recentHistory?.length || 0} history entries for result...`,
    );

    for (const promptHistory of recentHistory ?? []) {
      if (!promptHistory?.outputs || !promptHistory.prompt) {
        continue;
      }

      if (promptHistory.prompt[1] !== promptId) {
        continue;
      }

      const result = await this.extractMediaFromOutputs(
        promptHistory.outputs,
        promptId,
      );

      if (result) {
        return result;
      }
    }

    throw new Error("No result found. Task may still be processing.");
  }

  /**
   * Extract base64 media (image or video) from workflow outputs
   */
  private async extractMediaFromOutputs(
    outputs: Record<string, unknown>,
    promptId: string,
  ): Promise<GenerationResult & { mediaType?: 'image' | 'video' } | null> {
    const outputNodeIds = Object.keys(outputs);

    if (outputNodeIds.length === 0) {
      return null;
    }

    for (const nodeId of outputNodeIds) {
      const nodeData = outputs[nodeId];
      const images = (nodeData as { images?: unknown[] })?.images;

      if (!images?.length) {
        continue;
      }

      for (const image of images) {
        const result = await this.fetchMedia(
          promptId,
          nodeId,
          image,
        );

        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  /**
   * Fetch and convert media (image or video) to base64
   */
  private async fetchMedia(
    promptId: string,
    nodeId: string,
    image: unknown,
  ): Promise<GenerationResult & { mediaType?: 'image' | 'video' } | null> {
    const subfolder = (image as { subfolder?: string })?.subfolder ?? "";
    const filename = (image as { filename: string }).filename;
    
    // Determine if it's a video file based on extension
    const isVideo = filename.toLowerCase().endsWith('.mp4') || 
                    filename.toLowerCase().endsWith('.webm') ||
                    filename.toLowerCase().endsWith('.gif');
    
    const mediaType = isVideo ? 'video' as const : 'image' as const;
    const mimeType = isVideo 
      ? (filename.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4')
      : 'image/png';

    const mediaUrl = `${this.baseUrl}/view?prompt_id=${promptId}&node_id=${nodeId}&subfolder=${subfolder}&filename=${filename}`;

    try {
      const response = await fetch(mediaUrl, {
        signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.warn(
          `Failed to fetch media from ${mediaUrl}, status: ${response.status}`,
        );
        return null;
      }

      const blob = await response.blob();
      return this.blobToBase64(blob, promptId, mediaType, mimeType);
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === "AbortError") {
        console.warn("Fetch aborted, skipping this media");
      } else {
        console.error(`Error fetching media for node ${nodeId}:`, error);
      }
      return null;
    }
  }

  /**
   * Convert Blob to base64 data URL
   */
  private blobToBase64(
    blob: Blob, 
    promptId: string,
    mediaType: 'image' | 'video',
    mimeType: string,
  ): Promise<GenerationResult & { mediaType: 'image' | 'video'; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;
        console.log(`[ComfyUIWrapper] Successfully converted to base64, length: ${result.length}, type: ${mediaType}`);
        resolve({ 
          base64Url: result, 
          promptId,
          mediaType,
          mimeType
        });
      };

      reader.onerror = () => {
        reject(new Error("Failed to read media data"));
      };

      reader.readAsDataURL(blob);
    });
  }

  /**
   * Extract error message from response object
   */
  private extractErrorMessage(result: unknown): string {
    if (result && typeof result === "object" && "error" in result) {
      const errorData = (result as { error: unknown }).error;
      if (errorData && typeof errorData === "object" && "message" in errorData) {
        return String(errorData.message);
      }
    }
    return "Unknown error during queueing";
  }

  /**
   * Inject user parameters into workflow
   */
  private injectParameters(
    workflow: unknown,
    parameters: Record<string, unknown>,
  ): unknown {
    const sanitizedParameters = this.sanitizeParameters(parameters);
    const injected: Record<string, unknown> = {};

    for (const [nodeId, nodeData] of Object.entries(workflow as Record<string, unknown>)) {
      if (typeof nodeData === "object" && nodeData !== null && "inputs" in nodeData) {
        const node = nodeData as Record<string, unknown>;
        injected[nodeId] = {
          ...node,
          inputs: this.mergeInputs(node.inputs as Record<string, unknown>, sanitizedParameters),
        };
      } else {
        injected[nodeId] = nodeData;
      }
    }

    return injected;
  }

  /**
   * Sanitize parameters by removing invalid values
   */
  private sanitizeParameters(
    parameters: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (key === "seed" && value === -1) {
        console.warn("[ComfyUIWrapper] Removing invalid seed value: -1");
        continue;
      }
      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Merge user parameters into workflow inputs, replacing placeholders
   */
  private mergeInputs(
    inputs: Record<string, unknown>,
    parameters: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...inputs };

    for (const [paramName, paramValue] of Object.entries(parameters)) {
      if (paramValue !== undefined && paramValue !== null) {
        const paramValueStr = String(paramValue);
        // Replace {{paramName}} placeholders with actual values
        for (const [key, value] of Object.entries(merged)) {
          if (typeof value === "string") {
            merged[key] = value.replace(`{{${paramName}}}`, paramValueStr);
          }
        }
        merged[paramName] = paramValue;
      }
    }

    return merged;
  }

  /**
   * Utility: delay for polling
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ComfyUIWrapper;
