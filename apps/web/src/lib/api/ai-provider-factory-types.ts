/**
 * AI Generation Factory Pattern
 * Supports multiple AI providers and generation types
 */

// ==================== Generation Types ====================

export type AIGenerationType =
  | "text2text"
  | "text2image"
  | "text2audio"
  | "text2video"
  | "image2image"
  | "image2video"
  | "audio2audio"
  | "audio2text";

// ==================== Generation Result ====================

export interface GenerationResult {
  type: AIGenerationType;
  base64Url?: string;       // For images/videos
  audioUrl?: string;        // For audio/text
  textContent?: string;     // For text output
  promptId?: string;        // For tracking
  metadata?: Record<string, any>;
}

// ==================== Generation Parameters ====================

export interface GenerationParameters {
  [key: string]: any;
}

// ==================== Generation Task ====================

export interface GenerationTask {
  taskId: string;
  generationType: AIGenerationType;
  providerId: string;
  parameters: GenerationParameters;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: GenerationResult;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ==================== AI Provider Interface ====================

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  capabilities: AIGenerationType[];
  
  // Initialization
  initialize(): Promise<void>;
  isReady(): Promise<boolean>;
  
  // Generation
  generate(
    type: AIGenerationType,
    parameters: GenerationParameters,
    onProgress?: (progress: number) => void
  ): Promise<GenerationResult>;
  
  // Task management
  getTask(taskId: string): GenerationTask | undefined;
  cancelTask(taskId: string): Promise<void>;
  
  // Configuration
  configure(config: Record<string, any>): void;
  getConfig(): Record<string, any>;
  
  // Cleanup
  disconnect(): Promise<void>;
}

// ==================== Factory Interface ====================

export interface AIProviderFactoryInterface {
  createProvider(providerId: string): AIProvider | null;
  getAllProviders(): AIProvider[];
  getProvider(providerId: string): AIProvider | null;
  registerProvider(providerId: string, provider: AIProvider): void;
  unregisterProvider(providerId: string): void;
  getSupportedTypes(): AIGenerationType[];
}

// ==================== Generation Options ====================

export interface GenerationOptions {
  generationType: AIGenerationType;
  providerId?: string;  // Optional - if not provided, use default provider
  parameters: GenerationParameters;
  onProgress?: (progress: number) => void;
  onComplete?: (result: GenerationResult) => void;
  onError?: (error: Error) => void;
}

// ==================== Global AI Generation Manager ====================

export interface GlobalAIConfig {
  defaultProvider: string;
  providers: Record<string, {
    enabled: boolean;
    config: Record<string, any>;
  }>;
}
