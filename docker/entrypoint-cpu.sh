#!/bin/bash

# 修改 ComfyUI 以强制使用 CPU
if [ -f "/app/comfyui/comfy/model_management.py" ]; then
    sed -i 's/return torch.device(torch.cuda.current_device())/return torch.device("cpu")/g' /app/comfyui/comfy/model_management.py
    echo "Modified model_management.py to force CPU usage"
fi

# 启动 ComfyUI 并启用 CORS（默认允许所有头）
exec python main.py --listen 0.0.0.0 --enable-cors-header "*"
