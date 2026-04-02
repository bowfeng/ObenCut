# 文生视频功能完善任务

## 背景
用户已完成 PromptElement 的文生图功能，现在需要完善：
1. **任务一**：完善文生视频功能 ✅ 已完成
2. **任务二**：完善 ImageElement 的图生视频功能 ⏳ 进行中

---

## ✅ 任务一完成：文生视频完善

### 已完成修改

#### 1. ComfyUIWrapper 视频支持
- 更新 `GenerationResult` 接口，添加 `mediaType` 和 `mimeType` 字段
- 重命名 `extractImageFromOutputs` -> `extractMediaFromOutputs`
- 重命名 `fetchImage` -> `fetchMedia`
- 在 `fetchMedia` 中根据文件扩展名判断是图像还是视频
- 更新 `blobToBase64` 方法接受 mediaType 和 mimeType 参数
- 支持 `.mp4`, `.webm`, `.gif` 视频格式

#### 2. workflow-definitions.ts
- 添加 `image2video` 工作流定义
- 定义参数：prompt, image, frames, motionBucket, cfg, seed

#### 3. 创建 image2video.json 工作流
- 使用 AnimateDiff 实现图生视频
- 包含 LoadImage -> PrepImageForVideo -> AnimateDiffSampler -> VAEDecode -> SaveVideo

#### 4. ComfyUIProvider
- 更新 `capabilities` 数组，添加 `image2video`

#### 5. ai-generation-store.ts
- 更新 `generateMedia` 方法处理真实视频生成
- 移除 mock 逻辑，改用实际生成的视频文件
- 创建 VideoElement 时保存生成的媒体到 MediaManager
- 支持视频格式的验证

#### 6. PromptAIGCSection UI
- 动态显示 "Generate Video" 或 "Generate Image" 按钮
- 动态显示成功消息中的类型提示

### 工作流程
1. 用户选择 `generationType: "video"`
2. 输入提示词
3. 点击"Generate Video"
4. 调用 ComfyUI 的 text2video 工作流
5. ComfyUIWrapper 检测输出文件类型
6. 保存视频文件到 MediaManager
7. 创建 VideoElement 并添加到时间线

---

## 🔄 任务二进行中：图生视频完善

### 当前状态
- ✅ image2video.json 工作流已创建
- ⏳ ImageElement 属性面板需要添加"图生视频"功能

### 待实现内容

#### 1. ImageElement 属性面板扩展
需要创建新的组件来支持：
- 上传图像作为输入
- 图生视频参数配置（prompt, frames, motionBucket 等）
- 生成按钮

#### 2. 图生视频 UI 组件
建议创建 `ImageElementVideoGeneration.tsx`：
```typescript
interface ImageElementVideoGenerationProps {
  element: ImageElement;
}

export function ImageElementVideoGeneration({ element }: ImageElementVideoGenerationProps) {
  // 图生视频 UI 逻辑
}
```

#### 3. 工作流改进
当前 image2video.json 需要改进：
- 添加更灵活的 ControlNet 支持
- 支持多种图生视频模型
- 优化视频质量和时长

### 技术方案选择

**方案 A：AnimateDiff + ControlNet（推荐）**
- 优点：免费、离线、质量可控
- 缺点：需要用户在 ComfyUI 安装扩展

**方案 B：API 方案**
- 使用 RunwayML、Pika Labs、Stable Video Diffusion API
- 优点：质量高、配置简单
- 缺点：需要 API key、付费

### 下一步行动
1. 创建 ImageElement 图生视频 UI 组件
2. 测试 image2video 工作流
3. 根据测试结果优化

---

## 📝 技术笔记

### ComfyUI 视频工作流关键节点
- `EmptyLatentVideo` / `PrepImageForVideo` - 准备视频输入
- `AnimateDiffSampler` - 核心视频生成节点
- `VAEDecode` - 解码潜空间到像素
- `SaveVideo` - 保存视频文件

### 视频文件格式支持
- MP4: 最常用，兼容性好
- WebM: 网页友好，体积更小
- GIF: 适合短动画，体积较大

### 注意事项
1. 视频生成时间较长，需要良好的进度提示
2. 视频文件较大，需要考虑存储策略
3. 浏览器对视频格式的支持需要测试
4. 建议在生成完成后提供预览功能
