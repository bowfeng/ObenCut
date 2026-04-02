# 文生视频功能测试清单

## 环境准备

### 1. 启动 ComfyUI
```bash
# 确保 ComfyUI 已安装 AnimateDiff 扩展
cd /path/to/ComfyUI
python main.py
```

### 2. 验证环境变量
检查 `.env.local` 或 `.env.production` 中是否包含：
- `NEXT_PUBLIC_COMFYUI_HOST=localhost`
- `NEXT_PUBLIC_COMFYUI_PORT=8188`
- `NEXT_PUBLIC_COMFYUI_PROTOCOL=http`

### 3. 检查工作流文件
```bash
ls -la apps/web/public/workflows/
# 应包含：
# - text2image.json
# - text2video.json
# - image2image.json
# - image2video.json
```

---

## 测试步骤

### 测试 1：文生视频 (Text-to-Video)

#### 1.1 创建 PromptElement
1. 在时间线添加一个新的 Prompt Track
2. 在属性面板选择"AI Generation"
3. 设置：
   - Type: **Video**
   - Duration: 5s
   - Width: 512
   - Height: 512
   - Prompt: "A smooth animation of mountains at sunset"

#### 1.2 生成视频
1. 点击"Generate Video"按钮
2. 观察进度条（0% -> 100%）
3. 等待生成完成（可能需要 1-2 分钟）

#### 1.3 验证结果
- ✅ 视频是否成功添加到新的 Video Track？
- ✅ 视频文件名是否正确（aigc-video-*.mp4）？
- ✅ 视频能否在播放器中正常播放？
- ✅ 视频时长是否与设置的一致？

### 测试 2：图生视频 (Image-to-Video)

#### 2.1 准备测试图像
1. 使用文生图功能生成一张图片
2. 或上传一张本地图片

#### 2.2 配置图生视频
1. 选中 ImageElement
2. 在属性面板添加"Generate Video from Image"功能（待实现）
3. 设置参数：
   - Prompt: "Zoom in effect"
   - Frames: 24
   - Motion Bucket: 127

#### 2.3 生成视频
1. 点击生成按钮
2. 等待完成
3. 验证结果

### 测试 3：视频再生成 (Regenerate)

#### 3.1 修改提示词
1. 已生成一个视频
2. 修改 prompt 文本框内容
3. 点击"Regenerate"

#### 3.2 验证新版本
- ✅ 是否生成了新序号的视频（regenerated #2）？
- ✅ 新视频是否正确添加到时间线？

---

## 常见问题排查

### 问题 1：ComfyUI 连接失败
**现象**: 提示"ComfyUI connection is not established"

**排查**:
1. ComfyUI 是否已启动？
2. 端口是否正确（默认 8188）？
3. 防火墙是否阻止？

**解决**:
```bash
# 检查 ComfyUI 是否运行
curl http://localhost:8188/history

# 查看 OpenCut 控制台日志
```

### 问题 2：视频生成超时
**现象**: 提示"Generation timeout"

**排查**:
1. ComfyUI 是否安装了 AnimateDiff？
2. GPU 显存是否足够？
3. 视频参数是否过大（frames > 64）？

**解决**:
- 减少 frames 数量（建议 8-24）
- 增加 `DEFAULT_TIMEOUT_MS`（在 comfyui-wrapper.ts）
- 检查 ComfyUI 日志

### 问题 3：视频文件无法播放
**现象**: 视频生成成功但浏览器无法播放

**排查**:
1. 视频格式是否正确？
2. 浏览器是否支持该格式？
3. MIME 类型是否正确设置？

**解决**:
- 转换为 MP4 格式
- 使用 FFmpeg 转换
- 检查 `mimeType` 字段

### 问题 4：工作流节点缺失
**现象**: "Node not found" 错误

**排查**:
1. ComfyUI 是否安装了所需节点？
2. 节点名称是否正确？

**所需节点**:
- `AnimateDiffSampler` (来自 ComfyUI-AnimateDiff-Evolved)
- `EmptyLatentVideo`
- `SaveVideo`
- `PrepImageForVideo` (图生视频需要)

**安装命令**:
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved
```

---

## 验收标准

### 功能验收
- [ ] 文生视频功能正常工作
- [ ] 视频文件正确保存到 MediaManager
- [ ] VideoElement 正确添加到时间线
- [ ] 视频可在播放器中预览
- [ ] 再生成功能正常工作

### 代码质量
- [ ] 类型定义完整（TypeScript）
- [ ] 错误处理完善
- [ ] 日志记录清晰
- [ ] 代码可维护

### 用户体验
- [ ] 进度提示清晰
- [ ] 错误信息友好
- [ ] 生成时间合理
- [ ] UI 交互流畅

---

## 下一步优化

### 功能扩展
1. **ControlNet 支持** - 更精确的运动控制
2. **视频编辑** - 剪辑、裁剪、调整时长
3. **批量生成** - 一次生成多个视频
4. **预设模板** - 常用参数快速应用

### 性能优化
1. **进度实时更新** - 显示每个节点状态
2. **生成队列** - 支持排队任务
3. **缓存机制** - 相同 prompt 复用结果
4. **异步处理** - 不阻塞 UI

### 质量提升
1. **更高分辨率** - 支持 1080p/4K
2. **更长时长** - 支持 30s+ 视频
3. **更好质量** - 优化采样参数
4. **AI 增强** - 使用超分模型

---

## 技术文档

### 相关代码文件
- `apps/web/src/lib/api/comfyui/comfyui-wrapper.ts` - ComfyUI 封装
- `apps/web/src/lib/api/comfyui/workflow-definitions.ts` - 工作流定义
- `apps/web/src/stores/ai-generation-store.ts` - AI 生成状态管理
- `apps/web/src/components/editor/panels/properties/sections/prompt-ai-generation.tsx` - UI 组件
- `apps/web/public/workflows/text2video.json` - 文生视频工作流
- `apps/web/public/workflows/image2video.json` - 图生视频工作流

### 关键 API
```typescript
// 生成 AI 媒体
aiProviderFactory.generate({
  generationType: 'text2video',
  parameters: {
    prompt: '...',
    width: 512,
    height: 512,
    frames: 24,
  },
  onProgress: (progress) => { ... },
  onComplete: (result) => { ... },
  onError: (error) => { ... },
});
```

---

完成测试后，请更新此文档，记录测试结果和问题。
