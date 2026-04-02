/**
 * AI Provider Factory
 * Manages and creates AI providers
 */

import type {
  AIProvider,
  AIProviderFactoryInterface,
  AIGenerationType,
  GenerationOptions,
  GenerationResult,
  GlobalAIConfig,
} from "./ai-provider-factory-types";
import { ComfyUIProvider } from "./providers/comfyui-provider";
import { GeminiProvider } from "./providers/gemini-provider";

export class AIProviderFactory implements AIProviderFactoryInterface {
  private providers: Map<string, AIProvider> = new Map();
  private config: GlobalAIConfig;

  constructor() {
    try {
      // 确保配置值是有效的
      // Next.js 需要以 NEXT_PUBLIC_ 开头的环境变量才能在浏览器中访问
      const comfyuiHost = process.env.NEXT_PUBLIC_COMFYUI_HOST || "localhost";
      const comfyuiPort = parseInt(process.env.NEXT_PUBLIC_COMFYUI_PORT || "8188", 10);
      const comfyuiProtocol = (process.env.NEXT_PUBLIC_COMFYUI_PROTOCOL || "http").toLowerCase();

      // 详细的调试日志
      console.log('[AIProviderFactory] Reading environment variables:');
      console.log('[AIProviderFactory] NEXT_PUBLIC_COMFYUI_HOST:', process.env.NEXT_PUBLIC_COMFYUI_HOST);
      console.log('[AIProviderFactory] NEXT_PUBLIC_COMFYUI_PORT:', process.env.NEXT_PUBLIC_COMFYUI_PORT);
      console.log('[AIProviderFactory] NEXT_PUBLIC_COMFYUI_PROTOCOL:', process.env.NEXT_PUBLIC_COMFYUI_PROTOCOL);

      // 验证端口是否在有效范围内
      if (isNaN(comfyuiPort) || comfyuiPort < 1 || comfyuiPort > 9000) {
        console.warn(`[AIProviderFactory] COMFYUI_PORT is invalid: ${comfyuiPort}. Using default: 8188`);
      }

      if (comfyuiProtocol !== "http" && comfyuiProtocol !== "https") {
        console.warn(`[AIProviderFactory] COMFYUI_PROTOCOL is invalid: ${comfyuiProtocol}. Using default: http`);
      }

      const comfyuiConfig = {
        host: comfyuiHost,
        port: comfyuiPort,
        protocol: comfyuiProtocol,
      };

      console.log('[AIProviderFactory] ComfyUI config object:', JSON.stringify(comfyuiConfig, null, 2));

      this.config = {
        defaultProvider: "comfyui",
        providers: {
          comfyui: {
            enabled: true,
            config: comfyuiConfig,
          },
          gemini: {
            enabled: false,
            config: {
              apiKey: "",
              model: "gemini-pro",
            },
          },
        },
      };
    } catch (error) {
      console.error("[AIProviderFactory] Failed to initialize factory:", error);
      throw new Error(`AI Provider Factory initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  createProvider(providerId: string): AIProvider | null {
    // 如果已存在，直接返回
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }

    // 根据 providerId 创建新的 provider
    const providerConfig = this.config.providers[providerId];
    if (!providerConfig || !providerConfig.enabled) {
      console.warn(`Provider ${providerId} is not enabled`);
      return null;
    }

    let provider: AIProvider | null = null;

    switch (providerId) {
      case "comfyui":
        provider = new ComfyUIProvider(providerConfig.config as any);
        break;
      case "gemini":
        provider = new GeminiProvider(providerConfig.config as any);
        break;
      default:
        console.warn(`Unknown provider: ${providerId}`);
        return null;
    }

    if (provider) {
      this.providers.set(providerId, provider);
    }

    return provider;
  }

  getAllProviders(): AIProvider[] {
    const enabledProviders: AIProvider[] = [];

    for (const [id, config] of Object.entries(this.config.providers)) {
      if (!config.enabled) {
        continue;
      }

      let provider: AIProvider | null = null;

      if (this.providers.has(id)) {
        provider = this.providers.get(id)!;
      } else {
        provider = this.createProvider(id);
      }

      if (provider) {
        enabledProviders.push(provider);
      }
    }

    return enabledProviders;
  }

  getProvider(providerId: string): AIProvider | null {
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId)!;
    }

    return this.createProvider(providerId);
  }

  registerProvider(providerId: string, provider: AIProvider): void {
    this.providers.set(providerId, provider);
  }

  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  getSupportedTypes(): AIGenerationType[] {
    const types = new Set<AIGenerationType>();

    for (const provider of this.getAllProviders()) {
      for (const type of provider.capabilities) {
        types.add(type);
      }
    }

    return Array.from(types);
  }

  /**
   * Generate content using the factory pattern
   */
  async generate(options: GenerationOptions): Promise<GenerationResult> {
    const { generationType, providerId, parameters, onProgress, onComplete, onError } = options;

    // 如果没有指定 provider，使用默认 provider
    const targetProviderId = providerId || this.config.defaultProvider;

    // 获取 provider
    const provider = this.getProvider(targetProviderId);
    if (!provider) {
      const error = new Error(`Provider ${targetProviderId} not found or not enabled`);
      onError?.(error);
      throw error;
    }

    // 确保 provider 已初始化
    if (!await provider.isReady()) {
      try {
        await provider.initialize();
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    }

    try {
      const result = await provider.generate(generationType, parameters, onProgress);
      onComplete?.(result);
      return result;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 配置全局设置
   */
  configure(config: Partial<GlobalAIConfig>): void {
    Object.assign(this.config, config);
  }

  getConfig(): GlobalAIConfig {
    return { ...this.config };
  }

  /**
   * 初始化所有启用的 provider
   * 如果任何 provider 初始化失败，抛出错误
   */
  async initializeAll(): Promise<void> {
    const errors: Error[] = [];

    for (const provider of this.getAllProviders()) {
      try {
        await provider.initialize();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to initialize ${provider.id}:`, error);
        errors.push(new Error(`Failed to initialize ${provider.id}: ${errorMessage}`));
      }
    }

    // 如果有任何初始化错误，抛出第一个错误
    if (errors.length > 0) {
      throw errors[0];
    }
  }

  /**
   * 断开所有连接
   * 如果有任何 disconnect 失败，抛出错误
   */
  async disconnectAll(): Promise<void> {
    const errors: Error[] = [];

    for (const provider of this.providers.values()) {
      try {
        await provider.disconnect();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error disconnecting ${provider.id}:`, error);
        errors.push(new Error(`Error disconnecting ${provider.id}: ${errorMessage}`));
      }
    }

    // 如果有任何 disconnect 错误，抛出第一个错误
    if (errors.length > 0) {
      throw errors[0];
    }
  }
}

// 创建全局实例
export const aiProviderFactory = new AIProviderFactory();

export default aiProviderFactory;
