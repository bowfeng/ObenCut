"use client";

import { create } from "zustand";
import { generateUUID } from "@/utils/id";
import type {
  AIGCTask,
  AIGCTaskStatus,
  AIGCGenerationType,
  AIGCTaskType,
  ImageGenTask,
  VideoGenTask,
  AudioGenTask,
  Text2VideoGenTask,
  Image2VideoGenTask,
  Text2ImageGenTask,
  Image2ImageGenTask,
  Text2AudioGenTask,
  Image2AudioGenTask,
  GenericTask,
} from "@/types/ai-generation";
import type { VideoElement, ImageElement, AudioElement } from "@/types/timeline";
import { aiProviderFactory } from "@/lib/api/ai-provider-factory";
import type { AIGenerationType } from "@/lib/api/ai-provider-factory-types";
import { EditorCore } from "@/core";
import { MediaType } from "@/types/assets";
import { generateThumbnail } from "@/lib/media/processing";

interface AIGCState {
  tasks: AIGCTask[];
  isProcessing: boolean;
  
  // Actions
  addTask: (params: {
    sourceElementId: string;
    sourceTrackId: string;
    projectId: string;
    prompt: string;
    clipName: string;
    duration: number;
    width: number;
    height: number;
    frameRate?: number;
    length?: number;
    generationType: AIGCGenerationType;
    sourceElementType?: "image" | "text"; // 用于区分 ImageElement 和 TextElement
  }) => string; // 返回 task ID
  
  addImageTask: (params: Omit<ImageGenTask, "id" | "createdAt" | "status" | "progress">) => string;
  addVideoTask: (params: Omit<VideoGenTask, "id" | "createdAt" | "status" | "progress">) => string;
  addAudioTask: (params: Omit<AudioGenTask, "id" | "createdAt" | "status" | "progress">) => string;
  
  updateTaskStatus: (taskId: string, status: AIGCTaskStatus, result?: VideoElement | ImageElement) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTaskError: (taskId: string, errorMessage: string) => void;
  updateTaskPrompt: (taskId: string, prompt: string) => void;
  removeTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  
  // Real AI generation
  generateMedia: (taskId: string, sourceImage?: File) => Promise<void>;
}

export const useAIGCStore = create<AIGCState>((set, get) => ({
  tasks: [],
  isProcessing: false,

  addTask: ({ sourceElementId, sourceTrackId, projectId, prompt, clipName, duration, width, height, frameRate, length, generationType, sourceElementType }) => {
    const taskId = generateUUID();
    const roundedDuration = Math.round((duration || 5) * 10) / 10;
    
    // 根据 sourceElementType 和 generationType 确定 taskType
    // ImageElement + video -> "image-to-video"
    // TextElement (PromptElement) + video -> "text-to-video"
    // ImageElement + image -> "image-to-image"
    // TextElement (PromptElement) + image -> "text-to-image"
    let taskType: AIGCTaskType;
    if (generationType === "video") {
      taskType = sourceElementType === "image" ? "image-to-video" : "text-to-video";
    } else if (generationType === "image") {
      taskType = sourceElementType === "image" ? "image-to-image" : "text-to-image";
    } else if (generationType === "audio") {
      taskType = sourceElementType === "image" ? "image-to-audio" : "text-to-audio";
    } else {
      taskType = "text-to-image";
    }
    
    // 根据 generationType 创建对应的任务类型
    if (generationType === "image") {
      const newTask: ImageGenTask = {
        id: taskId,
        type: taskType as ImageGenTask["type"],
        status: "pending",
        sourceElementId,
        sourceTrackId,
        projectId,
        prompt,
        clipName,
        width: width || 1920,
        height: height || 1080,
        generationType: "image" as const,
        progress: 0,
        createdAt: new Date(),
      };
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isProcessing: true,
      }));
      get().generateMedia(taskId);
      return taskId;
    } else if (generationType === "video") {
      const newTask: VideoGenTask = {
        id: taskId,
        type: taskType as VideoGenTask["type"],
        status: "pending",
        sourceElementId,
        sourceTrackId,
        projectId,
        prompt,
        clipName,
        duration: roundedDuration,
        width: width || 1920,
        height: height || 1080,
        frameRate,
        length,
        generationType: "video" as const,
        progress: 0,
        createdAt: new Date(),
      };
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isProcessing: true,
      }));
      get().generateMedia(taskId);
      return taskId;
    } else if (generationType === "audio") {
      const newTask: AudioGenTask = {
        id: taskId,
        type: taskType as AudioGenTask["type"],
        status: "pending",
        sourceElementId,
        sourceTrackId,
        projectId,
        prompt,
        clipName,
        duration: roundedDuration,
        generationType: "audio" as const,
        progress: 0,
        createdAt: new Date(),
      };
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isProcessing: true,
      }));
      get().generateMedia(taskId);
      return taskId;
    }
    
    // Fallback for unknown generationType
    const newTask: ImageGenTask = {
      id: taskId,
      type: "text-to-image",
      status: "pending",
      sourceElementId,
      sourceTrackId,
      projectId,
      prompt,
      clipName,
      width: width || 1920,
      height: height || 1080,
      generationType: "image" as const,
      progress: 0,
      createdAt: new Date(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      isProcessing: true,
    }));
    get().generateMedia(taskId);
    return taskId;
  },

  updateTaskStatus: (taskId, status, result) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              resultElement: result as any,
              completedAt: status === "completed" ? new Date() : task.completedAt,
            }
          : task
      ),
      isProcessing: state.tasks.some(
        (t) => t.id !== taskId && t.status === "processing"
      ),
    }));
  },

  updateTaskProgress: (taskId, progress) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, progress } : task
      ),
    }));
  },

  updateTaskError: (taskId, errorMessage) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: "failed", errorMessage }
          : task
      ),
    }));
  },

  updateTaskPrompt: (taskId, prompt) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, prompt }
          : task
      ),
    }));
  },

  addImageTask: (params) => {
    const taskId = generateUUID();
    const newTask: ImageGenTask = {
      ...params,
      id: taskId,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      isProcessing: true,
    }));
    get().generateMedia(taskId);
    return taskId;
  },

  addVideoTask: (params) => {
    const taskId = generateUUID();
    const newTask: VideoGenTask = {
      ...params,
      id: taskId,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      isProcessing: true,
    }));
    get().generateMedia(taskId);
    return taskId;
  },

  addAudioTask: (params) => {
    const taskId = generateUUID();
    const newTask: AudioGenTask = {
      ...params,
      id: taskId,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      isProcessing: true,
    }));
    get().generateMedia(taskId);
    return taskId;
  },

  removeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  clearCompletedTasks: () => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.status !== "completed"),
    }));
  },

  generateMedia: async (taskId, sourceImage) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Type guard to check if task has width/height
    const hasImageDimensions = (t: AIGCTask): t is ImageGenTask | VideoGenTask =>
      t.generationType === "image" || t.generationType === "video";

    // Type guard to check if task has duration
    const hasDuration = (t: AIGCTask): t is VideoGenTask | AudioGenTask =>
      t.generationType === "video" || t.generationType === "audio";

    // Set status to processing and reset progress
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "processing", progress: 0 } : t
      ),
    }));

    // Map task type to workflow ID
    const TASK_TYPE_TO_WORKFLOW: Record<AIGCTaskType, string> = {
      "image-to-video": "image2video",
      "text-to-video": "text2video",
      "image-to-image": "image2image",
      "text-to-image": "text2image",
      "image-to-audio": "image2audio",
      "text-to-audio": "text2audio",
      generic: "generic",
    };
    const workflowId = TASK_TYPE_TO_WORKFLOW[task.type];

    try {
      // Use the AI provider factory for generation
      // This is now decoupled from any specific provider
      
      // Prepare parameters based on generation type
      const generationParams: Record<string, unknown> = {
        prompt: task.prompt,
        width: hasImageDimensions(task) ? task.width : 1920,
        height: hasImageDimensions(task) ? task.height : 1080,
        seed: Math.floor(Math.random() * 999999999999),
        steps: 20,
        cfgScale: 7,
        fps: task.frameRate || 24,
      };
      
      // For image2video, add the source image
      if (workflowId === "image2video" && sourceImage) {
        generationParams.sourceImage = sourceImage;
      }
      
      const result = await aiProviderFactory.generate({
        generationType: workflowId as AIGenerationType,
        parameters: generationParams,
        onProgress: (progress) => {
          get().updateTaskProgress(taskId, progress);
        },
        onComplete: (generationResult) => {
          // Handle result in try-catch below
        },
        onError: (error) => {
          get().updateTaskError(
            taskId,
            error instanceof Error ? error.message : "Generation failed"
          );
        },
      });

      // Process the generation result based on type
      if (task.generationType === "video") {
        // Handle video result
        get().updateTaskProgress(taskId, 90);

        try {
          // 验证结果是否为视频格式
          const isVideoResult = (result as any).mediaType === 'video' || 
                                (result.base64Url && result.base64Url.startsWith('data:video/'));
          
          if (!isVideoResult) {
            console.warn('[ai-generation-store] Received image result for video task, will create video element anyway');
          }

          const timestamp = Date.now();
          const randomName = `aigc-video-${timestamp}-${Math.random().toString(36).substr(2, 9)}.mp4`;
          
          // Create File from Data URL - need to decode base64 to bytes first
          const mimeType = (result as any).mimeType || 'video/mp4';
          
          // Extract base64 data from data URL (remove prefix like "data:video/mp4;base64,")
          let base64Data = result.base64Url as string;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }
          
          // Decode base64 to bytes and create Blob
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mimeType });
          const file = new File([blob], randomName, { type: mimeType });
          
          // Create MediaAsset object with explicit id
          const mediaAssetId = generateUUID();
          
          // Generate thumbnail for the video
          let thumbnailUrl: string | undefined;
          try {
            thumbnailUrl = await generateThumbnail({
              videoFile: file,
              timeInSeconds: 1,
            });
          } catch (error) {
            console.warn("Failed to generate video thumbnail, using default:", error);
          }
          
          const mediaAsset = {
            id: mediaAssetId,
            name: task.clipName || 'AI Generated Video',
            type: 'video' as MediaType,
            file: file,
            width: hasImageDimensions(task) ? task.width : 1920,
            height: hasImageDimensions(task) ? task.height : 1080,
            duration: hasDuration(task) ? task.duration : 5,
            thumbnailUrl,
            ephemeral: false,
          };

          // Add to MediaManager
          await EditorCore.getInstance().media.addMediaAsset({
            projectId: task.projectId,
            asset: mediaAsset,
          });

          get().updateTaskProgress(taskId, 100);
          // Create VideoElement with the new mediaId
          const videoElement: VideoElement = {
            type: "video",
            id: generateUUID(),
            name: task.clipName || "AI Generated Video",
            mediaId: mediaAssetId,
            duration: hasDuration(task) ? task.duration : 5,
            startTime: 0,
            trimStart: 0,
            trimEnd: hasDuration(task) ? task.duration : 5,
            sourceDuration: hasDuration(task) ? task.duration : 5,
            transform: {
              scale: 1,
              position: { x: 0, y: 0 },
              rotate: 0,
            },
            opacity: 1,
            muted: false,
            hidden: false,
          };
          get().updateTaskStatus(taskId, "completed", videoElement);
        } catch (mediaError) {
          console.error("Failed to save AI-generated video:", mediaError);
          get().updateTaskError(taskId, "Failed to save generated video");
          get().updateTaskStatus(taskId, "failed");
        }
      } else {
        // Handle image result (existing logic)
        get().updateTaskProgress(taskId, 90);

        try {
          const base64Url = result.base64Url;
          
          if (!base64Url) {
            throw new Error("No image data returned from generation");
          }
          
          const timestamp = Date.now();
          const randomName = `aigc-${timestamp}-${Math.random().toString(36).substr(2, 9)}.png`;
          
          // Create File from Data URL - need to decode base64 to bytes first
          let base64Data = base64Url as string;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }
          
          // Decode base64 to bytes and create Blob
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'image/png' });
          const file = new File([blob], randomName, { type: 'image/png' });
          
          // Create MediaAsset object with explicit id
          const mediaAssetId = generateUUID();
          
          // Create Data URL for preview
          const dataUrl = base64Url as string;
          
          const mediaAsset = {
            id: mediaAssetId,
            name: task.clipName || 'AI Generated Image',
            type: 'image' as MediaType,
            file: file,
            url: dataUrl,
            thumbnailUrl: dataUrl,
            width: hasImageDimensions(task) ? task.width : 1920,
            height: hasImageDimensions(task) ? task.height : 1080,
            duration: hasDuration(task) ? task.duration : 5,
            ephemeral: false,
          };

          // Add to MediaManager
          await EditorCore.getInstance().media.addMediaAsset({
            projectId: task.projectId,
            asset: mediaAsset,
          });

          get().updateTaskProgress(taskId, 100);
          // Create ImageElement with the new mediaId
          const imageElement: ImageElement = {
            type: "image",
            id: generateUUID(),
            name: task.clipName || "AI Generated Image",
            mediaId: mediaAssetId,
            duration: hasDuration(task) ? task.duration : 5,
            startTime: 0,
            trimStart: 0,
            trimEnd: hasDuration(task) ? task.duration : 5,
            sourceDuration: hasDuration(task) ? task.duration : 5,
            transform: {
              scale: 1,
              position: { x: 0, y: 0 },
              rotate: 0,
            },
            opacity: 1,
            hidden: false,
            effects: [],
          };
          get().updateTaskStatus(taskId, "completed", imageElement);
        } catch (mediaError) {
          console.error("Failed to save AI-generated image:", mediaError);
          // Just update task to failed, no need to create imageElement
          get().updateTaskError(taskId, "Failed to save generated image");
          get().updateTaskStatus(taskId, "failed");
        }
      }
    } catch (error) {
      // Error already handled by onError callback, but log for debugging
      console.error(`[useAIGCStore] Generation error for task ${taskId}:`, error);
      get().updateTaskError(taskId, "Generation failed");
      get().updateTaskStatus(taskId, "failed");
    }
  },
}));
