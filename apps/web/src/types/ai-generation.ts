// AIGC 相关的类型定义

import type { VideoElement, ImageElement, AudioElement } from "./timeline";

/** AIGC 任务状态 */
export type AIGCTaskStatus = "pending" | "processing" | "completed" | "failed";

/** AIGC 生成类型 */
export type AIGCGenerationType = "image" | "video" | "audio";

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * 所有任务共享的完整字段（包含所有可能的属性）
 * 用于在联合类型中访问通用属性
 */
export interface BaseTask {
  id: string;
  projectId: string;
  status: AIGCTaskStatus;
  sourceElementId: string;
  sourceTrackId: string;
  prompt: string;
  clipName: string;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * 所有任务共享的完整字段（包含所有可能的属性）
 * 用于联合类型的基础
 */
export interface AllTaskFields extends BaseTask {
  // 图像相关
  width?: number;
  height?: number;
  // 视频相关
  duration?: number;
  frameRate?: number;
  length?: number;
  // 通用
  generationType?: AIGCGenerationType;
  taskName?: string;
  taskData?: Record<string, unknown>;
  resultElement?: VideoElement | ImageElement | AudioElement;
}

// ============================================================================
// Generation Type Base Interfaces (中间层抽象)
// ============================================================================

/**
 * 图像生成任务基础接口
 */
export interface ImageGenTaskBase extends AllTaskFields {
  generationType: "image";
  width: number;
  height: number;
}

/**
 * 视频生成任务基础接口
 */
export interface VideoGenTaskBase extends AllTaskFields {
  generationType: "video";
  duration: number;
  width: number;
  height: number;
  frameRate?: number;
  length?: number;
}

/**
 * 音频生成任务基础接口
 */
export interface AudioGenTaskBase extends AllTaskFields {
  generationType: "audio";
  duration: number;
}

// ============================================================================
// Specific Task Interfaces (具体任务类型)
// ============================================================================

/**
 * 文生图任务
 */
export interface Text2ImageGenTask extends ImageGenTaskBase {
  type: "text-to-image";
  resultElement?: ImageElement;
}

/**
 * 图生图任务
 */
export interface Image2ImageGenTask extends ImageGenTaskBase {
  type: "image-to-image";
  resultElement?: ImageElement;
}

/**
 * 文生视频任务
 */
export interface Text2VideoGenTask extends VideoGenTaskBase {
  type: "text-to-video";
  resultElement?: VideoElement;
}

/**
 * 图生视频任务
 */
export interface Image2VideoGenTask extends VideoGenTaskBase {
  type: "image-to-video";
  resultElement?: VideoElement;
}

/**
 * 文生音频任务
 */
export interface Text2AudioGenTask extends AudioGenTaskBase {
  type: "text-to-audio";
  resultElement?: AudioElement;
}

/**
 * 图生音频任务
 */
export interface Image2AudioGenTask extends AudioGenTaskBase {
  type: "image-to-audio";
  resultElement?: AudioElement;
}

/**
 * 通用任务（没有具体 type）
 */
export interface GenericTask extends AllTaskFields {
  type: "generic";
  taskName: string;
  taskData?: Record<string, unknown>;
  resultElement?: VideoElement | ImageElement | AudioElement | Record<string, unknown>;
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * 图像生成任务联合类型
 */
export type ImageGenTask = Text2ImageGenTask | Image2ImageGenTask;

/**
 * 视频生成任务联合类型
 */
export type VideoGenTask = Text2VideoGenTask | Image2VideoGenTask;

/**
 * 音频生成任务联合类型
 */
export type AudioGenTask = Text2AudioGenTask | Image2AudioGenTask;

/**
 * AIGC 任务联合类型
 * 所有任务类型的并集
 */
export type AIGCTask = ImageGenTask | VideoGenTask | AudioGenTask | GenericTask;

/**
 * 获取任务类型的辅助类型
 */
export type AIGCTaskType = AIGCTask["type"];

/**
 * AIGC 生成参数
 */
export interface AIGCGenerationParams {
  prompt: string;
  duration?: number;       // 生成的媒体时长（秒）
  fps?: number;            // 帧率
  resolution?: {           // 分辨率
    width: number;
    height: number;
  };
  generationType?: AIGCGenerationType; // 生成类型
}