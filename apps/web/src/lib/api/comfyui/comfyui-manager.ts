/**
 * ComfyUI Manager
 * Manages a single connection to ComfyUI server using singleton pattern
 */

import type { ComfyUIServerConfig } from "./comfyui-wrapper";
import { ComfyUIWrapper } from "./comfyui-wrapper";

interface ComfyUIManagerState {
  instance: ComfyUIWrapper | null;
  connectionPromise: Promise<void> | null;
}

/**
 * ComfyUI Manager - Singleton pattern for ComfyUI server connections
 * Provides a single shared instance across the application
 */
class ComfyUIManager {
  private static instance: ComfyUIManager;
  private state: ComfyUIManagerState = {
    instance: null,
    connectionPromise: null,
  };

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): ComfyUIManager {
    if (!ComfyUIManager.instance) {
      ComfyUIManager.instance = new ComfyUIManager();
    }
    return ComfyUIManager.instance;
  }

  /**
   * Get or create a ComfyUI wrapper instance
   * Returns a promise that resolves when connection is established
   */
  async getOrCreate(config: ComfyUIServerConfig): Promise<ComfyUIWrapper> {
    if (!this.state.instance) {
      this.state.instance = new ComfyUIWrapper(config);
      this.state.connectionPromise = this.connect();
    }

    await this.state.connectionPromise;
    return this.state.instance;
  }

  /**
   * Establish connection to ComfyUI server
   */
  private async connect(): Promise<void> {
    if (!this.state.instance) {
      throw new Error("No instance to connect");
    }

    try {
      await this.state.instance.connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[ComfyUIManager] Failed to connect:", errorMessage);
      throw new Error(`Failed to connect to ComfyUI server: ${errorMessage}`);
    }
  }

  /**
   * Get the current instance (without connecting)
   */
  getInstance(): ComfyUIWrapper | null {
    return this.state.instance;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.instance !== null;
  }

  /**
   * Close the connection
   */
  async disconnect(): Promise<void> {
    if (this.state.instance) {
      try {
        await this.state.instance.close();
      } catch (error) {
        console.warn("[ComfyUIManager] Error closing connection:", error);
      }
      this.state.instance = null;
      this.state.connectionPromise = null;
    }
  }

  /**
   * Reset the manager (useful for testing)
   */
  reset(): void {
    this.disconnect();
  }
}

// Export singleton instance
const manager = ComfyUIManager.getInstance();

/**
 * Get or create a ComfyUI wrapper instance
 */
export async function getComfyUIManager(config: ComfyUIServerConfig): Promise<ComfyUIWrapper> {
  return manager.getOrCreate(config);
}

/**
 * Close the ComfyUI connection
 */
export async function closeComfyUIManager(): Promise<void> {
  await manager.disconnect();
}

/**
 * Reset the ComfyUI manager (for testing)
 */
export function resetComfyUIManager(): void {
  manager.reset();
}

/**
 * Get the current instance without connecting
 */
export function getComfyUIManagerInstance(): ComfyUIWrapper | null {
  return manager.getInstance();
}

/**
 * Check if connected to ComfyUI server
 */
export function isComfyUIConnected(): boolean {
  return manager.isConnected();
}
