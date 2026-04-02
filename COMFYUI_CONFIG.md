# ComfyUI 配置说明

## 配置状态

✅ **已配置**: ComfyUI 已配置为使用 `localhost:8188`

## 配置文件位置

- **环境变量**: `apps/web/.env`
- **示例配置**: `apps/web/.env.example`

## 当前配置

```bash
COMFYUI_HOST=localhost
COMFYUI_PORT=8188
COMFYUI_PROTOCOL=http
```

## 配置说明

### COMFYUI_HOST
- 默认值: `localhost`
- 说明: ComfyUI 服务器地址

### COMFYUI_PORT
- 默认值: `8188`
- 说明: ComfyUI 服务器端口
- 重要: 确保与 `docker-compose.yml` 中的端口映射一致

### COMFYUI_PROTOCOL
- 默认值: `http`
- 说明: 通信协议（http 或 https）

## 验证配置

### 1. 检查 ComfyUI 是否运行

```bash
# 本地开发
curl http://localhost:8188/system_stats

# Docker 环境
curl http://localhost:8188/system_stats
```

### 2. 检查端口映射

在 `docker-compose.yml` 中确认：
```yaml
comfyui:
  ports:
    - "8188:8188"  # 这应该与 .env 中的端口一致
```

### 3. 查看应用日志

启动应用后，查看控制台输出：
```
[ComfyUIProvider] Creating wrapper with config: { host: 'localhost', port: 8188, protocol: 'http' }
```

## 常见问题

### 问题: WebSocket timed out after 15000 ms

**原因**: 端口配置不正确或 ComfyUI 服务未运行

**解决**:
1. 确认 `.env` 文件中 `COMFYUI_PORT` 为 `8188`
2. 确认 ComfyUI 正在运行: `docker ps | grep comfyui`
3. 检查端口是否被占用: `netstat -tuln | grep 8188`

### 问题: Failed to connect to ComfyUI server

**原因**: ComfyUI 未启动或网络不可达

**解决**:
1. 启动 ComfyUI: `docker-compose up -d comfyui`
2. 检查防火墙设置
3. 确认 Docker 网络配置

### 问题: 在 Docker 网络内访问

如果 web 应用和 ComfyUI 都在 Docker 网络中，修改 `.env`:

```bash
COMFYUI_HOST=comfyui  # 服务名
COMFYUI_PORT=8188
COMFYUI_PROTOCOL=http
```

## 修改配置

如果需要修改配置：

1. 编辑 `apps/web/.env` 文件
2. 保存后重启应用

```bash
# 如果使用 Docker
docker-compose restart web

# 如果本地开发
# 重启开发服务器
```

## 下一步

配置完成后，可以：

1. 启动应用: `npm run dev`
2. 访问 ComfyUI: http://localhost:8188
3. 在应用中使用 AI 生成功能