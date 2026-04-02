// PromptElement 类型定义
// 用于 AI 生成图像和视频的提示元素

import type { Effect } from "./effects";
import type { Transform } from "./rendering";
import type { BlendMode } from "./rendering";

export interface PromptElement {
  type: "prompt";
  id: string;
  name: string;
  prompt: string; // AI 生成提示词
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
  sourceDuration?: number;
  
  // 生成配置
  generationType: "image" | "video" | "audio";
  resolution: {
    width: number;
    height: number;
  };
  
  // 动画和样式
  animations?: unknown; // 预留动画支持
  blendMode?: BlendMode;
  effects?: Effect[];
  hidden?: boolean;
}

export type CreatePromptElement = Omit<PromptElement, "id">;
