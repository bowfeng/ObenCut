# AI Generation Factory Pattern

## Overview

A flexible, extensible factory pattern for managing multiple AI providers (ComfyUI, Gemini, etc.) with support for various generation types.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Global AI Manager                   │
│         (aiProviderFactory)                 │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼─────┐ ┌───▼────┐ ┌────▼────────┐
│ ComfyUI     │ │ Gemini │ │  Other      │
│ Provider    │ │        │ │  Providers  │
└─────────────┘ └────────┘ └─────────────┘
```

## Generation Types

Supported generation types:

- `text2text` - Text generation
- `text2image` - Image generation
- `text2audio` - Audio generation
- `text2video` - Video generation
- `image2image` - Image modification
- `image2video` - Image to video
- `audio2audio` - Audio modification
- `audio2text` - Speech to text

## Providers

### ComfyUI Provider
- **ID**: `comfyui`
- **Capabilities**: text2image, text2video, image2image
- **Configuration**: Local ComfyUI server
- **Implementation**: Uses workflow JSON files

### Gemini Provider
- **ID**: `gemini`
- **Capabilities**: text2text, text2image (Imagen), text2audio, text2video
- **Configuration**: Google API key
- **Implementation**: REST API calls

## Usage

### 1. Initialize the Factory

```typescript
import { aiProviderFactory } from "@/lib/api/ai-provider-factory";

// Initialize all enabled providers
await aiProviderFactory.initializeAll();
```

### 2. Configure Providers

```typescript
// Configure ComfyUI
aiProviderFactory.configure({
  providers: {
    comfyui: {
      enabled: true,
      config: {
        host: "localhost",
        port: 8188,
        protocol: "http",
      },
    },
    gemini: {
      enabled: false,
      config: {
        apiKey: "YOUR_API_KEY",
      },
    },
  },
});
```

### 3. Generate Content

```typescript
import { AIGenerationType } from "@/lib/api/ai-factory-types";
import { aiProviderFactory } from "@/lib/api/ai-provider-factory";

// Using default provider
const result = await aiProviderFactory.generate({
  generationType: AIGenerationType.TEXT2IMAGE,
  parameters: {
    prompt: "A beautiful sunset over mountains",
    width: 1024,
    height: 1024,
    steps: 20,
    cfg: 7,
  },
  onProgress: (progress) => {
    console.log(`Progress: ${progress}%`);
  },
  onComplete: (result) => {
    console.log("Generation complete:", result);
  },
  onError: (error) => {
    console.error("Error:", error);
  },
});
```

### 4. Use Specific Provider

```typescript
// Explicitly use ComfyUI
const result = await aiProviderFactory.generate({
  generationType: AIGenerationType.TEXT2IMAGE,
  providerId: "comfyui",
  parameters: {
    prompt: "A beautiful sunset",
    width: 1024,
    height: 1024,
  },
});
```

## Adding New Providers

### Step 1: Create Provider Class

```typescript
import type { AIProvider, AIGenerationType } from "./ai-factory-types";

export class MyProvider implements AIProvider {
  id = "myprovider";
  name = "My AI Provider";
  description = "Custom AI provider";
  
  capabilities: AIGenerationType[] = ["text2image", "text2video"];

  async initialize(): Promise<void> {
    // Setup connection
  }

  async generate(
    type: AIGenerationType,
    parameters: any,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    // Implement generation logic
  }

  async disconnect(): Promise<void> {
    // Cleanup
  }

  // Implement other required methods...
}
```

### Step 2: Register in Factory

```typescript
// In ai-provider-factory.ts
import { MyProvider } from "./providers/my-provider";

case "myprovider":
  provider = new MyProvider(providerConfig.config as any);
  break;
```

## Workflow Support

ComfyUI provider supports workflow JSON files:

```
public/workflows/
├── text2image.json
├── text2video.json
├── image2image.json
└── ...
```

### Adding a New Workflow

1. Create workflow JSON file in `public/workflows/`
2. Add to `workflow-definitions.ts`:

```typescript
{
  id: "myworkflow",
  name: "My Workflow",
  description: "Custom workflow",
  filePath: "/workflows/myworkflow.json",
  parameters: {
    prompt: { type: "string", default: "" },
    // ...
  },
}
```

## Best Practices

### 1. Lazy Initialization
Providers are initialized on first use unless `initializeAll()` is called.

### 2. Error Handling
Always use `onError` callback to handle failures gracefully.

### 3. Progress Tracking
Use `onProgress` callback to update UI during generation.

### 4. Provider Discovery
Use `getSupportedTypes()` to query available generation types.

### 5. Provider Switching
Easily switch between providers for the same generation type.

## Extending to More Providers

### Example: Stable Diffusion API

```typescript
export class StableDiffusionProvider implements AIProvider {
  id = "stable-diffusion-api";
  // ... implementation
}
```

### Example: Replicate API

```typescript
export class ReplicateProvider implements AIProvider {
  id = "replicate";
  // ... implementation
}
```

## File Structure

```
src/lib/api/
├── ai-factory-types.ts          # Types and interfaces
├── ai-provider-factory.ts       # Factory implementation
├── workflow-loader.ts           # Workflow JSON loader
├── workflow-definitions.ts      # Workflow registry
└── providers/
    ├── comfyui-provider.ts      # ComfyUI implementation
    └── gemini-provider.ts       # Gemini implementation
```

## Future Enhancements

- [ ] Add more providers (Replicate, Hugging Face)
- [ ] Provider health checks
- [ ] Automatic provider selection based on cost/speed
- [ ] Batch generation support
- [ ] Streaming results
- [ ] Provider authentication management
- [ ] Usage tracking and billing
