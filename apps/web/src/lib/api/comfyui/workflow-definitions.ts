/**
 * ComfyUI Workflow Definitions
 * Maps workflow names to their JSON files
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  filePath: string;
  parameters?: Record<string, {
    type: string;
    default: any;
    min?: number;
    max?: number;
  }>;
}

// Workflow definitions registry
export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: "text2image",
    name: "Text2Image",
    description: "Text to image generation using local checkpoint",
    filePath: "/home/bow/.openclaw/workspace/opencut/apps/web/public/workflows/text2image.json",
    parameters: {
      prompt: { type: "string", default: "" },
      width: { type: "number", default: 1080, min: 256, max: 2048 },
      height: { type: "number", default: 1920, min: 256, max: 2048 },
      seed: { type: "number", default: () => Math.floor(Math.random() * 999999999999), min: 0, max: 999999999999 },
      steps: { type: "number", default: 10, min: 1, max: 100 },
      cfg: { type: "number", default: 1, min: 0, max: 30 },
      denoise: { type: "number", default: 1, min: 0, max: 1 },
    },
  },
  {
    id: "text2video",
    name: "Text2Video",
    description: "Text to video generation using standard ComfyUI nodes (no AnimateDiff required)",
    filePath: "/home/bow/.openclaw/workspace/opencut/apps/web/public/workflows/text2video.json",
    parameters: {
      prompt: { type: "string", default: "" },
      width: { type: "number", default: 832, min: 256, max: 2048 },
      height: { type: "number", default: 480, min: 256, max: 2048 },
      frames: { type: "number", default: 24, min: 8, max: 128 },
      seed: { type: "number", default: () => Math.floor(Math.random() * 999999999999) },
      steps: { type: "number", default: 20, min: 1, max: 100 },
      cfgScale: { type: "number", default: 7, min: 1, max: 30 },
      fps: { type: "number", default: 24, min: 1, max: 60 },
    },
  },
  {
    id: "image2image",
    name: "Image2Image",
    description: "Image to image modification",
    filePath: "/home/bow/.openclaw/workspace/opencut/apps/web/public/workflows/image2image.json",
    parameters: {
      prompt: { type: "string", default: "" },
      negativePrompt: { type: "string", default: "" },
      image: { type: "file", default: null },
      strength: { type: "number", default: 0.75, min: 0, max: 1 },
      seed: { type: "number", default: () => Math.floor(Math.random() * 999999999999) },
      steps: { type: "number", default: 20, min: 1, max: 100 },
    },
  },
  {
    id: "image2video",
    name: "Image2Video",
    description: "Image to video generation using LTXV (LTX-2.3 model)",
    filePath: "/home/bow/.openclaw/workspace/opencut/apps/web/public/workflows/image2video.json",
    parameters: {
      prompt: { type: "string", default: "" },
      image: { type: "file", default: null },
      width: { type: "number", default: 832, min: 256, max: 2048 },
      height: { type: "number", default: 480, min: 256, max: 2048 },
      length: { type: "number", default: 121, min: 17, max: 257 },
      frameRate: { type: "number", default: 24, min: 1, max: 60 },
      seed: { type: "number", default: () => Math.floor(Math.random() * 999999999999) },
    },
  },
];

export type WorkflowId = (typeof WORKFLOW_DEFINITIONS)[number]["id"];

export function getWorkflowDefinition(workflowId: WorkflowId): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS.find(w => w.id === workflowId);
}

export function getAllWorkflows(): WorkflowDefinition[] {
  return WORKFLOW_DEFINITIONS;
}
