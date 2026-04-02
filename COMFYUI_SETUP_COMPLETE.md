# ComfyUI 设置完成指南

## ✅ 系统状态

**ComfyUI 服务器：**
- ✅ 容器正在运行
- ✅ CORS 已启用（`Access-Control-Allow-Origin: *`）
- ✅ API 可访问：http://localhost:8188
- ✅ WebSocket 连接支持
- ✅ Python 版本：3.11.15
- ✅ ComfyUI 版本：0.18.1
- ✅ PyTorch：2.11.0+cpu

**验证命令：**
```bash
# 检查服务状态
curl http://localhost:8188/system_stats

# 检查 CORS 头
curl -I http://localhost:8188/ | grep -i "access-control"
```

## 🔧 已完成的修复

### 1. Base64 转换错误修复
**文件：** `apps/web/src/stores/ai-generation-store.ts:213`

**问题：** 使用 `fetch(base64Data)` 将 base64 字符串当作 URL，导致 404 错误。

**修复：** 使用 `atob()` 正确解码 base64 为二进制字符串。
```typescript
// 提取 base64 数据
const base64Data = base64Url.split(',')[1];

// 解码 base64 到二进制字符串
const binaryString = atob(base64Data);

// 转换为 Uint8Array
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}

// 创建 Blob
const blob = new Blob([bytes], { type: 'image/png' });
```

### 2. 工作流文件更新
**文件：** `apps/web/public/workflows/text2image.json`

**问题：** 原工作流只有测试节点（LoadImage/SaveImage），缺少生成节点。

**修复：** 添加了完整的生成流程：
- CheckpointLoaderSimple（加载模型）
- EmptyLatentImage（创建空 latent）
- CLIPTextEncode（编码提示词）
- KSampler（采样生成）
- SaveImage（保存结果）

### 3. ComfyUI Docker 配置
**文件：** `docker-compose-cpu.yml`

**配置：**
```yaml
environment:
  - COMFYUI_QUEUE_PROMPT=true
  - USE_CPU=1
  - PYTORCH_ENABLE_MPS_FALLBACK=1
  - DISABLE_CUDA=1
  - HuggingFace:__models__disable_cuda=True
  - ENABLE_CORS_HEADER=true  # 启用 CORS
```

## 📦 安装模型

工作流需要以下模型文件：

1. **Checkpoint**（必需）：
   ```bash
   cp v1-5-pruned-emaonly.ckpt /path/to/comfyui/models/checkpoints/
   # 或复制到 Docker 容器
   docker cp v1-5-pruned-emaonly.ckpt comfyui:/ComfyUI/models/checkpoints/
   ```

2. **VAE**（可选，推荐）：
   ```bash
   cp vae-ft-mse-840000.ckpt /path/to/comfyui/models/vae/
   docker cp vae-ft-mse-840000.ckpt comfyui:/ComfyUI/models/vae/
   ```

## ⚙️ 应用配置

**文件：** `apps/web/src/stores/ai-generation-store.ts:27`

```typescript
const comfyApi = getComfyUISingleton({
  host: "localhost",
  port: 8188,
  protocol: "http",
  timeout: 300000,  // 可选：连接超时（毫秒）
  ssl: false,       // 可选：如果使用 https 则设为 true
});
```

**可选配置：**
- `timeout`: 连接和生成超时时间（毫秒），默认 15 分钟
- `ssl`: 是否使用 HTTPS 连接

## 🎨 工作流参数

支持的参数在 `apps/web/src/lib/api/workflow-definitions.ts` 中定义：

| 参数 | 类型 | 说明 | 可选值 |
|------|------|------|--------|
| `prompt` | string | 提示词 | 任意文本 |
| `width` | number | 图像宽度 | 256-2048 |
| `height` | number | 图像高度 | 256-2048 |
| `seed` | number | 随机种子 | 0-999999999999 |
| `steps` | number | 采样步数 | 1-100 |
| `cfg` | number | CFG scale | 0-30 |
| `negativePrompt` | string | 负面提示词 | 任意文本 |

## 🚀 测试

### 在 ComfyUI 界面中测试

1. 访问 http://localhost:8188
2. 点击 "Load" 按钮
3. 选择 `text2image` 工作流
4. 输入提示词（如 "A beautiful landscape"）
5. 点击 "Queue Prompt"
6. 等待生成完成

### 在应用中测试

1. 在 OpenCut 编辑器中选择一个元素
2. 点击 AI 生成面板
3. 输入提示词并设置参数
4. 点击生成按钮
5. 查看生成的图片

## 📊 常见问题

### Q: WebSocket timed out
**A:** 
- 确保防火墙允许 8188 端口
- 检查 ComfyUI 日志：`docker logs comfyui`
- 验证 CORS 已启用：`curl -I http://localhost:8188/ | grep access-control`

### Q: Model not found
**A:** 
- 检查模型文件是否放在正确的目录
- 确认文件名与工作流匹配
- 重启 ComfyUI：`docker restart comfyui`

### Q: Generation produces no results
**A:**
- 检查服务器日志：`docker logs comfyui --tail 50`
- 确认 CPU 可用（当前配置使用 CPU）
- 减少采样步数（steps）或降低分辨率
- 等待更长时间（CPU 生成较慢）

### Q: Access denied error
**A:** 
- 确认 `ENABLE_CORS_HEADER=true` 已设置
- 重启容器使配置生效：`docker restart comfyui`

## 🏗️ 系统架构

```
┌─────────────┐
│   React    │
│  Application│
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ ComfyUIWrapper   │
│ (ai-generation-  │
│  store.ts)       │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ ComfyUI Singleton│
│ (comfyui-        │
│  singleton.ts)   │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ comfyui-client   │
│ (@stable-canvas/ │
│  comfyui-client) │
└──────┬───────────┘
       │ WebSocket
       ↓
┌──────────────────┐
│  ComfyUI Server  │
│  (localhost:     │
│   8188)          │
└──────────────────┘
```

## 📝 技术细节

### 文件修改清单

1. `apps/web/src/stores/ai-generation-store.ts`
   - 修复 base64 转换逻辑

2. `apps/web/public/workflows/text2image.json`
   - 更新工作流定义

3. `apps/web/src/lib/api/comfyui-wrapper.ts`
   - 增强配置支持（timeout, ssl）

4. `docker-compose-cpu.yml`
   - 添加 CORS 启用参数

### 关键修复代码

**Base64 转换（ai-generation-store.ts）：**
```typescript
const base64Data = base64Url.split(',')[1];
const binaryString = atob(base64Data);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}
const blob = new Blob([bytes], { type: 'image/png' });
```

**CORS 配置（docker-compose-cpu.yml）：**
```yaml
environment:
  - ENABLE_CORS_HEADER=true
```

## 📚 相关文档

- [ComfyUI 官方文档](https://github.com/comfyanonymous/ComfyUI)
- [comfyui-client 文档](https://github.com/stable-canvas/comfyui-client)
- [项目设置指南](COMFYUI_INTEGRATION.md)
- [AI 生成健壮性](AI_GENERATION_ROBUSTNESS.md)