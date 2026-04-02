# OpenCut ComfyUI 已安装软件备份

**备份时间**: 2026-03-27  
**项目**: OpenCut (opencut-comfyui)

---

## 1. 系统依赖 (System Dependencies)

### apt 包
```
wget
git
python3-dev
```

---

## 2. Python 基础包

### CPU 版本
```
torch (CPU 版本)
torchvision (CPU 版本)
torchaudio (CPU 版本)
```

### GPU 版本 (cu126 - Blackwell 支持)
```
torch (cu126)
torchvision (cu126)
torchaudio (cu126)
```

---

## 3. ComfyUI 核心包

### 核心依赖 (requirements.txt)
```
comfyui-frontend-package==1.42.8
comfyui-workflow-templates==0.9.36
comfyui-embedded-docs==0.4.3
torchsde==0.2.6
einops
transformers>=4.50.3
tokenizers>=0.13.3
sentencepiece
safetensors>=0.4.2
aiohttp>=3.11.8
yarl>=1.18.0
pyyaml
scipy
tqdm
psutil
alembic
SQLAlchemy
av>=14.2.0
comfy-kitchen>=0.2.8
comfy-aimdo>=0.2.12
requests
simpleeval>=1.0.0
blake3
kornia>=0.7.1
spandrel
pydantic~=2.0
pydantic-settings~=2.0
PyOpenGL
glfw
```

---

## 4. ComfyUI 自定义节点 (Custom Nodes)

### ComfyUI-Manager
- **仓库**: https://github.com/Comfy-Org/ComfyUI-Manager.git
- **用途**: ComfyUI 节点管理器，用于安装和管理其他自定义节点

### ComfyUI-FramePackWrapper
- **仓库**: https://github.com/kijai/ComfyUI-FramePackWrapper.git
- **用途**: 视频帧处理包装器，支持图像到视频生成

---

## 5. 下载模型文件

### CPU 版本预下载模型

#### sigclip 模型
```
sigclip_vision_384.safetensors
来源：https://huggingface.co/Comfy-Org/sigclip_vision_384/resolve/main/sigclip_vision_384.safetensors
路径：/app/comfyui/models/sigclip/
```

#### Hunyuan Video 文本编码器
```
t5xxl_fp8_e4m3fn.safetensors
clip_l.safetensors
来源：https://huggingface.co/Comfy-Org/HunyuanVideo_repackaged/
路径：/app/comfyui/models/hunyuan_video/
```

#### FramePack 模型
```
FramePackI2V_HY_bf16.safetensors
来源：https://huggingface.co/Kijai/HunyuanVideo_comfy/resolve/main/FramePackI2V_HY_bf16.safetensors
路径：/app/comfyui/models/diffusion_models/
```

### GPU 版本
GPU 版本的模型在运行时动态下载，不预下载。

---

## 6. 环境变量配置

### CPU 版本
```bash
CUDA_VISIBLE_DEVICES=""
FORCE_CPU=1
TORCH_CUDA_ARCH_LIST=""
```

### GPU 版本 (Blackwell 支持)
```bash
CUDA_VISIBLE_DEVICES=0
TORCH_CUDA_ARCH_LIST="8.6 8.9 9.0 12.0"
```

---

## 7. 目录结构

```
/app/
└── comfyui/
    ├── custom_nodes/
    │   ├── ComfyUI-Manager/
    │   └── ComfyUI-FramePackWrapper/
    ├── models/
    │   ├── diffusers/
    │   │   └── lllyasviel/
    │   ├── diffusion_models/
    │   │   └── FramePackI2V_HY_bf16.safetensors (CPU 版本)
    │   ├── hunyuan_video/
    │   │   ├── t5xxl_fp8_e4m3fn.safetensors (CPU 版本)
    │   │   └── clip_l.safetensors (CPU 版本)
    │   └── sigclip/
    │       └── sigclip_vision_384.safetensors (CPU 版本)
    ├── input/
    ├── output/
    └── temp/
```

---

## 8. 恢复指南

### 方法 1: 使用 Docker 镜像重建
```bash
# CPU 版本
docker build -t opencut-comfyui-cpu -f docker/Dockerfile-CPU.comfyui .

# GPU 版本
docker build -t opencut-comfyui-gpu -f docker/Dockerfile-GPU.comfyui .
```

### 方法 2: 手动安装
```bash
# 1. 克隆 ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git /app/comfyui

# 2. 安装 Python 依赖
pip install -r docker/requirements-cpu.txt

# 3. 安装自定义节点
cd /app/comfyui/custom_nodes
git clone https://github.com/Comfy-Org/ComfyUI-Manager.git
git clone https://github.com/kijai/ComfyUI-FramePackWrapper.git

# 4. 安装自定义节点的依赖
pip install -r /app/comfyui/custom_nodes/ComfyUI-Manager/requirements.txt
pip install -r /app/comfyui/custom_nodes/ComfyUI-FramePackWrapper/requirements.txt
```

---

## 9. 相关配置文件

- `docker/Dockerfile-CPU.comfyui` - CPU 版本 Docker 构建文件
- `docker/Dockerfile-GPU.comfyui` - GPU 版本 Docker 构建文件
- `docker/requirements-cpu.txt` - CPU 版本 Python 依赖
- `docker/entrypoint-cpu.sh` - CPU 版本启动脚本
- `docker/entrypoint-gpu.sh` - GPU 版本启动脚本
- `docker-compose-cpu.yml` - CPU 版本 Docker Compose 配置
- `docker-compose.yml` - GPU 版本 Docker Compose 配置

---

**备份完成**