# ComfyUI AI Generation Integration

## Overview

This integration connects OpenCut with ComfyUI for AI-powered image and video generation using the `@stable-canvas/comfyui-client` library.

## Installation

The library has already been installed:

```bash
bun add @stable-canvas/comfyui-client
```

## Files

### 1. API Wrapper
- **File:** `apps/web/src/lib/api/comfyui-api.ts`
- **Purpose:** Wrapper around `@stable-canvas/comfyui-client`
- **Key Features:**
  - Pipeline-based image generation (simplified workflow)
  - WebSocket connection management
  - Base64 URL conversion
  - Queue management

### 2. Generation Service
- **File:** `apps/web/src/lib/api/ai-generation-service.ts`
- **Purpose:** Service layer for task management
- **Features:**
  - Task lifecycle tracking
  - Result element creation
  - Progress management

## Configuration

### Environment Variables

Add to `apps/web/.env.local`:

```bash
# ComfyUI Server Configuration
COMFYUI_HOST=localhost
COMFYUI_PORT=8188
COMFYUI_PROTOCOL=http
```

### Default Settings

- **Host:** `localhost`
- **Port:** `8188` (default ComfyUI API port)
- **Protocol:** `http`

## Usage

### 1. Initialize the Service

```typescript
import { initializeGenerationService } from "@/lib/api/ai-generation-service";

// Initialize when app starts
await initializeGenerationService({
  host: process.env.COMFYUI_HOST || "localhost",
  port: Number(process.env.COMFYUI_PORT) || 8188,
  protocol: (process.env.COMFYUI_PROTOCOL as "http" | "https") || "http",
});
```

### 2. Generate an Image

```typescript
import { getGenerationService } from "@/lib/api/ai-generation-service";

const service = getGenerationService();

const taskId = "unique-task-id";

const { resultElement } = await service.generateImage(taskId, {
  prompt: "A beautiful sunset over mountains",
  width: 1920,
  height: 1080,
  seed: -1, // -1 for random seed
  steps: 20,
  cfgScale: 7,
  negativePrompt: "low quality, bad anatomy, worst quality",
});

// resultElement is an ImageElement ready to add to timeline
```

### 3. Check Task Status

```typescript
const task = service.getTask(taskId);
console.log(`Status: ${task.status}`);
console.log(`Progress: ${task.progress}%`);
```

## ComfyUI Setup

### Prerequisites

1. Install ComfyUI: https://github.com/comfyanonymous/ComfyUI
2. Download SDXL model (`sd_xl_base_1.0.safetensors`) to `ComfyUI/models/checkpoints/`

### Start ComfyUI

```bash
cd ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

### Verify Connection

Visit: `http://localhost:8181` to access ComfyUI interface

## Library Features

### Pipeline API (Recommended)

The library provides a simple pipeline API for common workflows:

```typescript
import { Pipeline, outToB64Urls } from "@stable-canvas/comfyui-client";

const pipeline = new Pipeline()
  .with(client)
  .model("sdxl_base_1.0.safetensors")
  .prompt("Your prompt here")
  .negative("negative prompt")
  .size(1024, 1024)
  .steps(20)
  .cfg(7)
  .save();

const result = await pipeline.wait();
const base64Urls = outToB64Urls(result);
```

### Benefits

- **No workflow JSON needed** - Pipeline handles it automatically
- **Simple API** - Method chaining is intuitive
- **Type-safe** - Full TypeScript support
- **Zero dependencies** - Library is dependency-free

## Integration with PromptElement

The `PromptAIGCSection` component will integrate with this service:
1. User enters prompt in properties panel
2. Click "Generate" button
3. Service sends request to ComfyUI
4. Result is downloaded as base64 URL
5. ImageElement is created
6. Element is added to timeline automatically

## Testing

1. Start ComfyUI server
2. Add "Default prompt" element to timeline
3. Open properties panel → AI Generation
4. Enter prompt and click "Generate"
5. Result should appear in timeline

## Library Documentation

- **Client API:** https://stablecanvas.github.io/comfyui-client/classes/Client.html
- **WebSocket API:** https://stablecanvas.github.io/comfyui-client/classes/WsClient.html
- **Pipeline API:** https://stablecanvas.github.io/comfyui-client/classes/Pipeline.html

## Examples

See library examples:
- **Text to Image:** https://github.com/StableCanvas/comfyui-client/blob/main/examples/nodejs/src/main-pipe-t2i.ts
- **Image to Image:** https://github.com/StableCanvas/comfyui-client/blob/main/examples/nodejs/src/main-pipe-i2i.ts

## Future Enhancements

- [ ] Support for img2img workflows
- [ ] Video generation with animatediff
- [ ] ControlNet integration
- [ ] LoRA support
- [ ] Custom workflow templates
- [ ] Model selection UI
- [ ] Batch generation
- [ ] Progress animation

## Notes

- The pipeline uses SDXL model by default
- Model name can be customized in `comfyui-api.ts`
- Requires ComfyUI with basic nodes (CheckpointLoaderSimple, KSampler, etc.)
- Base64 encoding happens on the server side
- Image elements are created with default dimensions (1920x1080, 5s duration)
