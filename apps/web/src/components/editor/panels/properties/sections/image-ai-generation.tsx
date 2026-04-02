"use client";

import { useState, useEffect, useRef } from "react";
import { Section, SectionContent, SectionField, SectionHeader, SectionTitle } from "../section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2Icon, SparklesIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { useAIGCStore } from "@/stores/ai-generation-store";
import { useEditor } from "@/hooks/use-editor";
import { useElementSelection } from "@/hooks/timeline/element/use-element-selection";
import type { ImageElement } from "@/types/timeline";
import { toast } from "sonner";

interface AIGCSectionProps {
  element: ImageElement;
  trackId: string;
}

export function ImageAIGCSection({ element, trackId }: AIGCSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [clipName, setClipName] = useState(() => {
    // Remove file extension from image name for default name
    const nameWithoutExt = element.name.replace(/\.[^/.]+$/, "");
    return nameWithoutExt;
  });
  const [duration, setDuration] = useState(() => Math.round(element.duration * 10) / 10);
  const [resolutionWidth, setResolutionWidth] = useState(832);
  const [resolutionHeight, setResolutionHeight] = useState(480);
  const [frameRate, setFrameRate] = useState(24);
  const { tasks, addTask, updateTaskProgress, updateTaskStatus, updateTaskPrompt } = useAIGCStore();
  const editor = useEditor();
  const addedElementsRef = useRef<Set<string>>(new Set()); // Track already-added element IDs
  
  // Use selectedElements to ensure component re-renders when selection changes
  const { selectedElements } = useElementSelection();

  // Reset form state when element or selection changes
  useEffect(() => {
    setPrompt("");
    // Remove file extension from image name for default name
    const nameWithoutExt = element.name.replace(/\.[^/.]+$/, "");
    setClipName(nameWithoutExt);
    setDuration(Math.round(element.duration * 10) / 10);
    setFrameRate(24); // Default LTXV frame rate
    
    // Get image dimensions from media assets
    const assets = editor.media.getAssets();
    const imageAsset = assets.find((asset) => asset.id === element.mediaId);
    if (imageAsset) {
      setResolutionWidth(imageAsset.width || 832);
      setResolutionHeight(imageAsset.height || 480);
    }
  }, [element.id, element.name, element.duration, element.mediaId, editor.media, selectedElements]);

  // Find the task for the current element
  const currentTask = tasks.find((task) => task.sourceElementId === element.id);

  // Track the previous status to detect status changes
  const previousStatusRef = useRef<string | undefined>(undefined);

  // Automatically add generated video to timeline when task completes
  useEffect(() => {
    if (currentTask?.status === "completed" && currentTask?.resultElement) {
      // Only add when status changes to completed (not on every render)
      if (previousStatusRef.current !== "completed" && currentTask.status === "completed") {
        // Skip if this task has already been added
        if (addedElementsRef.current.has(currentTask.id)) {
          return;
        }

        // Get all tracks in the current project
        const tracks = editor.timeline.getTracks();
        
        // Find original track index and insert new track below it
        const originalTrackIndex = tracks.findIndex(t => t.id === trackId);
        const insertIndex = originalTrackIndex >= 0 ? originalTrackIndex + 1 : tracks.length;
        
        // Add new track
        const newTrackId = editor.timeline.addTrack({ type: "video", index: insertIndex });
        
        // Add generated video to new track at the same time position as the original image
        if (currentTask.resultElement) {
          editor.timeline.insertElement({
            element: {
              ...currentTask.resultElement,
              startTime: element.startTime, // Set same time position as original image
            } as any,
            placement: {
              mode: "explicit",
              trackId: newTrackId,
            },
          });
        }
        
        // Mark as added
        addedElementsRef.current.add(currentTask.id);
        
        toast.success("AI 视频生成成功", {
          description: `已添加 "${currentTask.clipName}" 到时间轴`,
        });
      }
    }
    
    // Update previous status
    previousStatusRef.current = currentTask?.status;
  }, [currentTask?.status, currentTask?.resultElement, trackId, element.startTime]);

  const handleCreate = () => {
    if (!prompt.trim()) {
      toast.error("提示词不能为空", {
        description: "请输入描述要生成视频的提示词",
      });
      return;
    }

    const projectId = editor.project.getActive().metadata.id;
    if (!projectId) {
      toast.error("无法获取项目 ID", {
        description: "请先保存项目",
      });
      return;
    }

    // Get the source image file from media assets
    const assets = editor.media.getAssets();
    const sourceImageAsset = assets.find((asset) => asset.id === element.mediaId);
    const sourceImageFile = sourceImageAsset?.file;
    
    if (!sourceImageFile) {
      toast.error("未找到源图片", {
        description: "请先上传或添加图片到项目",
      });
      return;
    }

    // Calculate LTXV length: frameRate * duration + 1
    // LTXV requires length to be odd and in range [17, 257]
    const calculatedLength = frameRate * Number(duration) + 1;
    const length = Math.max(17, Math.min(257, calculatedLength));

    const taskId = addTask({
      sourceElementId: element.id,
      sourceTrackId: trackId,
      projectId: projectId,
      prompt: prompt.trim(),
      clipName: clipName.trim() || element.name,
      duration: Number(duration) || element.duration || 5,
      width: Number(resolutionWidth) || 832,
      height: Number(resolutionHeight) || 480,
      frameRate,
      length,
      generationType: "video",
      sourceElementType: "image", // 标识这是 ImageElement
    });

    // Pass the source image file to generateMedia
    // Use the store's generateMedia function directly
    const { generateMedia } = useAIGCStore.getState();
    generateMedia(taskId, sourceImageFile);

    toast.success("任务已创建", {
      description: "AI 正在生成视频，请稍候...",
    });
  };

  const handleRecreate = () => {
    if (!currentTask) return;
    
    // Clear added flag to allow re-addition
    addedElementsRef.current.delete(currentTask.id);
    
    // Recreate task with existing parameters
    const projectId = editor.project.getActive().metadata.id;
    addTask({
      sourceElementId: element.id,
      sourceTrackId: trackId,
      projectId: projectId,
      prompt: currentTask.prompt,
      clipName: currentTask.clipName,
      duration: currentTask.duration || 5,
      width: currentTask.width || 832,
      height: currentTask.height || 480,
      frameRate: currentTask.frameRate || 24,
      length: currentTask.length,
      generationType: currentTask.generationType || "video",
      sourceElementType: "image", // 标识这是 ImageElement
    });

    toast.success("开始重新生成", {
      description: "AI 正在重新生成视频...",
    });
  };

  return (
    <Section collapsible sectionKey={`${element.type}:ai-generation`}>
      <SectionHeader>
        <SectionTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4" />
          AIGC 生成
        </SectionTitle>
      </SectionHeader>
      
      <SectionContent className="space-y-4">
        {!currentTask ? (
          // Show input form when no task exists
          <>
            <SectionField label="提示词 (Prompt)">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的视频内容，例如：'一只猫在桌子上跳跃'"
                rows={4}
                className="resize-none"
              />
            </SectionField>
            
            <SectionField label="生成的视频名称">
              <Input
                value={clipName}
                onChange={(e) => setClipName(e.target.value)}
                placeholder="AI Generated Video"
              />
            </SectionField>
            
            <div className="grid grid-cols-3 gap-4">
              <SectionField label="视频时长 (秒)">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </SectionField>
              
              <SectionField label="帧率 (fps)">
                <Input
                  type="number"
                  value={frameRate}
                  onChange={(e) => setFrameRate(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </SectionField>
              
              <SectionField label="帧数 (LTXV)">
                <Input
                  type="number"
                  value={frameRate * Number(duration) + 1}
                  disabled
                  className="bg-muted"
                />
              </SectionField>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <SectionField label="视频宽度">
                <Input
                  type="number"
                  value={resolutionWidth}
                  onChange={(e) => setResolutionWidth(Number(e.target.value))}
                  min={192}
                  max={7680}
                />
              </SectionField>
              
              <SectionField label="视频高度">
                <Input
                  type="number"
                  value={resolutionHeight}
                  onChange={(e) => setResolutionHeight(Number(e.target.value))}
                  min={108}
                  max={4320}
                />
              </SectionField>
            </div>
            
            <Button
              onClick={handleCreate}
              className="w-full"
              size="sm"
            >
              <SparklesIcon className="mr-2 size-4" />
              生成视频
            </Button>
          </>
        ) : (
          // Show task status
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Task status</span>
                <span className="text-xs text-muted-foreground">
                  {currentTask.progress}%
                </span>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center gap-2 text-sm">
                {currentTask.status === "processing" && (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                )}
                {currentTask.status === "completed" && (
                  <>
                    <CheckCircleIcon className="size-4 text-green-500" />
                    <span className="text-green-500">Generation complete</span>
                  </>
                )}
                {currentTask.status === "failed" && (
                  <>
                    <AlertCircleIcon className="size-4 text-red-500" />
                    <span className="text-red-500">Generation failed</span>
                  </>
                )}
              </div>
              
              {/* Progress bar */}
              {currentTask.status !== "completed" && currentTask.status !== "failed" && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  {(() => {
                    const progress = typeof currentTask.progress === "number" ? currentTask.progress : 0;
                    return (
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    );
                  })()}
                </div>
              )}
              
              {/* Prompt display */}
              <div className="rounded-md bg-muted p-3 text-xs">
                <div className="mb-1 font-medium text-muted-foreground">Prompt:</div>
                {currentTask.status === "completed" || currentTask.status === "failed" ? (
                  <input
                    type="text"
                    value={currentTask.prompt}
                    onChange={(e) => {
                      updateTaskPrompt(currentTask.id, e.target.value);
                    }}
                    className="w-full bg-transparent text-sm outline-none focus:border-b focus:border-primary"
                    placeholder="Enter new prompt..."
                  />
                ) : (
                  <div className="text-foreground">{currentTask.prompt}</div>
                )}
              </div>
              
              {/* Post-completion actions */}
              {currentTask.status === "completed" && currentTask.resultElement && (
                <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:bg-green-500/20 dark:text-green-400">
                  ✅ Video generated and added to timeline!
                  <div className="mt-1 text-xs opacity-70">
                    Duration: {(currentTask.resultElement as any)?.duration?.toFixed(1) ?? "0.0"}s
                  </div>
                  <Button
                    onClick={handleRecreate}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    🔄 Regenerate
                  </Button>
                </div>
              )}
              
              {currentTask.status === "failed" && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-400">
                  ❌ {currentTask.errorMessage || "Generation failed, please try again"}
                  <Button
                    onClick={handleRecreate}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    🔄 Regenerate
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SectionContent>
    </Section>
  );
}
