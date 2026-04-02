# AI Generation Integration Guide

## Overview
This document explains how the AI generation feature integrates with ComfyUI for real image/video generation.

## Implementation Status

### ✅ Completed
- **Image Generation**: Fully integrated with ComfyUI
  - Uses `ComfyUIWrapper.generateImage()` method
  - Accepts prompt, width, height, and other parameters
  - Returns actual generated images from ComfyUI server
  - Creates `ImageElement` with real media data

### ⚠️ Placeholder (Video)
- **Video Generation**: Currently uses simulation
  - The implementation creates mock VideoElements
  - Real video generation requires a dedicated ComfyUI workflow
  - You need to:
    1. Create a ComfyUI workflow for video generation
    2. Load the workflow JSON file
    3. Implement video-specific logic in `generateMedia()` method

## Code Structure

### Store (`ai-generation-store.ts`)
```typescript
// Key changes:
1. Removed `simulateGeneration()` method
2. Added `generateMedia()` method
3. Initializes ComfyUIWrapper with local configuration
4. Calls ComfyUI for real generation
```

### Image Generation Flow
1. User inputs prompt and settings
2. `addTask()` creates task and calls `generateMedia()`
3. `generateMedia()` calls `comfyApi.generateImage()`
4. ComfyUI generates the image
5. `ImageElement` is created with generated data
6. Element is added to timeline automatically

## Configuration

### ComfyUI Server
The store initializes ComfyUIWrapper with:
```typescript
const comfyApi = new ComfyUIWrapper({
  host: "localhost",
  port: 8188,
});
```

**To change configuration:**
1. Update `host` and `port` in `ai-generation-store.ts`
2. Or pass config as parameter when creating store
3. Ensure ComfyUI server is running on the specified address

## Testing

### Test Image Generation
1. Start ComfyUI server (if not already running)
2. Open any image in the editor
3. Scroll to "AIGC 生成" section
4. Enter prompt and settings
5. Click "生成视频" (Generate Video)
6. Wait for generation to complete
7. Generated video should appear on timeline

### Test Error Handling
1. Stop ComfyUI server
2. Try to generate an image
3. Should show error message: "Generation failed"

## Future Enhancements

1. **Real Video Generation**
   - Create ComfyUI workflow for video generation
   - Store workflow in `public/workflows/video2image.json`
   - Implement video generation logic

2. **Progress Tracking**
   - Add real progress updates during ComfyUI generation
   - Display progress bar with actual generation status

3. **Configuration UI**
   - Add settings panel for ComfyUI server configuration
   - Allow users to change host/port dynamically

4. **Workflow Selection**
   - Support multiple ComfyUI workflows
   - Allow users to select workflow for different generation types

## Troubleshooting

### "Generation failed" Error
- Check if ComfyUI server is running
- Verify server address and port are correct
- Check console for detailed error messages

### Images not loading
- Ensure ComfyUI is generating images successfully
- Check browser console for CORS or network errors
- Verify workflow JSON file exists

### Video generation not working
- Video generation requires a dedicated ComfyUI workflow
- Currently uses simulation as placeholder
- See Future Enhancements for implementation