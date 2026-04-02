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
import type { PromptElement } from "@/types/prompt-element";
import type { TrackType } from "@/types/timeline";
import type { ImageElement } from "@/types/timeline";
import { toast } from "sonner";

interface PromptAIGCSectionProps {
  element: PromptElement;
  trackId: string;
}

// External storage to persist added media IDs across component re-renders
const addedMediaIds = new Set<string>();

export function PromptAIGCSection({ element, trackId }: PromptAIGCSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [clipName, setClipName] = useState(() => {
    const nameWithoutExt = element.name.replace(/\.[^/.]+$/, "");
    return nameWithoutExt || "Generated Media";
  });
  const [counter, setCounter] = useState(1);
  const [duration, setDuration] = useState(() => Math.round(element.duration * 10) / 10);
  const [resolutionWidth, setResolutionWidth] = useState(element.resolution?.width || 1920);
  const [resolutionHeight, setResolutionHeight] = useState(element.resolution?.height || 1080);
  const [generationType, setGenerationType] = useState<"image" | "video" | "audio">(element.generationType || "image");
  const { tasks, addTask, updateTaskPrompt } = useAIGCStore();
  const editor = useEditor();
  const { selectedElements } = useElementSelection();
  const currentMediaIdRef = useRef<string>("");
  
  // Check if media has already been added (using external storage)
  const isMediaAdded = (mediaId: string) => addedMediaIds.has(mediaId);
  
  // Add media to tracking when generation completes
  const markMediaAsAdded = (mediaId: string) => {
    addedMediaIds.add(mediaId);
  };

  useEffect(() => {
    setPrompt(element.prompt || "");
    const nameWithoutExt = element.name.replace(/\.[^/.]+$/, "");
    setClipName(nameWithoutExt || "Generated Media");
    setDuration(Math.round(element.duration * 10) / 10);
    setResolutionWidth(element.resolution?.width || 1920);
    setResolutionHeight(element.resolution?.height || 1080);
    setGenerationType(element.generationType || "image");
  }, [element.id, element.name, element.duration, element.prompt, element.resolution, element.generationType, selectedElements]);

  // Find the latest task for this element (including regenerate tasks)
  const elementTasks = tasks.filter((task) => task.sourceElementId === element.id);
  const currentTask = elementTasks.length > 0 ? elementTasks[elementTasks.length - 1] : null;

  useEffect(() => {
    if (currentTask?.status === "completed" && currentTask?.resultElement) {
      const mediaId = (currentTask.resultElement as any).mediaId;
      
      // Check if this media has already been added
      if (isMediaAdded(mediaId)) {
        return;
      }

      const tracks = editor.timeline.getTracks();
      const originalTrackIndex = tracks.findIndex(t => t.id === trackId);
      const insertIndex = originalTrackIndex >= 0 ? originalTrackIndex + 1 : tracks.length;
      const trackType: TrackType = currentTask.generationType === "audio" ? "audio" : "video";
      
      const newTrackId = editor.timeline.addTrack({ type: trackType, index: insertIndex });
      
      editor.timeline.insertElement({
        element: { ...currentTask.resultElement, startTime: element.startTime } as any,
        placement: { mode: "explicit", trackId: newTrackId },
      });
      
      // Mark as added in external storage
      markMediaAsAdded(mediaId);
      currentMediaIdRef.current = mediaId;
      
      toast.success(
        `${currentTask.generationType === "audio" ? "Audio" : currentTask.generationType === "video" ? "Video" : "Image"} generated successfully`,
        { description: `Added "${currentTask.clipName}" to timeline` },
      );
    }
  }, [currentTask?.status, currentTask?.resultElement, currentTask?.generationType, trackId, element.startTime, editor.timeline]);

  // Core generation logic (reused by both handleGenerate and handleRegenerate)
  const performGeneration = async ({
    generatePrompt,
    generateClipName,
    isRegenerate = false,
  }: {
    generatePrompt: string;
    generateClipName: string;
    isRegenerate?: boolean;
  }) => {
    if (!generatePrompt.trim()) {
      toast.error("Prompt is required", { description: "Please enter a description for the generated media" });
      return;
    }

    // Check if there's already a pending task for this element
    const existingPendingTask = tasks.find((task) => task.sourceElementId === element.id && task.status === "pending");
    
    if (existingPendingTask) {
      toast.warning("Task already pending", { description: "Another generation task is already in progress." });
      return;
    }

    const counterValue = isRegenerate ? counter + 1 : counter;
    const newName = isRegenerate ? `${clipName} (regenerated #${counterValue})` : generateClipName;

    const projectId = editor.project.getActive().metadata.id;
    addTask({
      sourceElementId: element.id,
      sourceTrackId: trackId,
      projectId,
      prompt: generatePrompt.trim(),
      clipName: newName,
      duration: Number(duration) || 5,
      width: Number(resolutionWidth) || 832,
      height: Number(resolutionHeight) || 480,
      generationType: generationType,
      sourceElementType: "text", // 标识这是 PromptElement (TextElement)
    });
  };

  const handleGenerate = async () => {
    await performGeneration({ generatePrompt: prompt, generateClipName: clipName });
  };

  const handleRegenerate = async () => {
    if (!currentTask || currentTask.status === "pending") return;

    const counterValue = counter + 1;
    
    // Update counter and clipName state
    setCounter(counterValue);
    setClipName(`${clipName} (regenerated #${counterValue})`);
    
    // Clear external storage to allow new image to be added
    addedMediaIds.clear();
    
    // Call performGeneration to create a new task
    await performGeneration({ 
      generatePrompt: currentTask.prompt, 
      generateClipName: `${clipName} (regenerated #${counterValue})`,
      isRegenerate: true,
    });
  };

  return (
    <Section collapsible sectionKey={`${element.type}:ai-generation`}>
      <SectionHeader>
        <SectionTitle className="flex items-center gap-2">
          <SparklesIcon className="size-4" />
          AI Generation
        </SectionTitle>
      </SectionHeader>
      
      <SectionContent className="space-y-4">
        {!currentTask ? (
          <>
            <SectionField label="Prompt">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate"
                rows={4}
                className="resize-none"
              />
            </SectionField>
            
            <SectionField label="Media name">
              <Input
                value={clipName}
                onChange={(e) => setClipName(e.target.value)}
                placeholder="Generated Image"
              />
            </SectionField>
            
            <div className="grid grid-cols-2 gap-4">
              <SectionField label="Type">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={generationType === "image" ? "default" : "outline"}
                    onClick={() => setGenerationType("image")}
                    className="flex-1"
                  >
                    Image
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={generationType === "video" ? "default" : "outline"}
                    onClick={() => setGenerationType("video")}
                    className="flex-1"
                  >
                    Video
                  </Button>
                </div>
              </SectionField>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <SectionField label="Duration (s)">
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </SectionField>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <SectionField label="Width">
                <Input
                  type="number"
                  value={resolutionWidth}
                  onChange={(e) => setResolutionWidth(Number(e.target.value))}
                  min={192}
                  max={7680}
                />
              </SectionField>
              
              <SectionField label="Height">
                <Input
                  type="number"
                  value={resolutionHeight}
                  onChange={(e) => setResolutionHeight(Number(e.target.value))}
                  min={108}
                  max={4320}
                />
              </SectionField>
            </div>
            
            <Button onClick={handleGenerate} className="w-full" size="sm">
              <SparklesIcon className="mr-2 size-4" />
              {generationType === "video" ? "Generate Video" : "Generate Image"}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Task status</span>
              <span className="text-xs text-muted-foreground">{currentTask.progress}%</span>
            </div>
            
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
            
            {currentTask.status !== "completed" && currentTask.status !== "failed" && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${currentTask.progress}%` }} />
              </div>
            )}
            
            <div className="rounded-md bg-muted p-3 text-xs">
              <div className="mb-1 font-medium text-muted-foreground">Prompt:</div>
              {(currentTask.status === "completed" || currentTask.status === "failed") && (
                <input
                  type="text"
                  value={currentTask.prompt}
                  onChange={(e) => updateTaskPrompt(currentTask.id, e.target.value)}
                  className="w-full bg-transparent text-sm outline-none focus:border-b focus:border-primary"
                  placeholder="Enter new prompt..."
                />
              )}
            </div>
            
            {currentTask.status === "completed" && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:bg-green-500/20 dark:text-green-400">
                ✅ {currentTask.generationType === "video" ? "Video" : "Image"} generated and added to timeline!
                <div className="mt-1 text-xs opacity-70">Duration: {(currentTask.resultElement as any)?.duration?.toFixed(1) ?? "0.0"}s</div>
                <Button onClick={handleRegenerate} variant="outline" size="sm" className="mt-2 w-full">
                  🔄 Regenerate
                </Button>
              </div>
            )}
            
            {currentTask.status === "failed" && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-400">
                ❌ {currentTask.errorMessage || "Generation failed, please try again"}
                <Button onClick={handleRegenerate} variant="outline" size="sm" className="mt-2 w-full">
                  🔄 Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </SectionContent>
    </Section>
  );
}
