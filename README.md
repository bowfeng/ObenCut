# ObenCut - AI-Powered Video Editor

<div align="center">

<img src="apps/web/public/logos/opencut/ObenCut.svg" alt="ObenCut Logo" width="100" />

**A free, open-source AI-powered video editor for web, desktop, and mobile.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-black)](https://nextjs.org/)
[![Bun](https://img.shields.io/badge/Bun-black)](https://bun.sh/)

</div>

---

## 🚀 Overview

ObenCut is a **fork of [OpenCut](https://github.com/OpenCut-app/OpenCut)** with enhanced AI capabilities powered by **ComfyUI**. This project aims to seamlessly integrate cutting-edge AI-generated content into a professional-grade video editing workflow.

While OpenCut provides the foundation for privacy-first, open-source video editing, ObenCut extends its capabilities to include:

- **AI Text-to-Video** generation
- **AI Text-to-Image** generation  
- **AI Image-to-Video** transitions
- **AI Image-to-Image** effects
- And more ComfyUI-powered features coming soon

---

## ⚡ Why ObenCut?

### The Original Vision (from OpenCut)

- **Privacy**: Your videos stay on your device
- **Free features**: Most basic CapCut features are now paywalled
- **Simple**: People want editors that are easy to use

### ObenCut's AI Enhancement

- **AI-Powered Content Creation**: Generate videos, images, and effects with AI
- **ComfyUI Integration**: Leverage powerful AI workflows for content generation
- **Seamless Workflow**: Use AI-generated content directly in your video timeline
- **Still Privacy-First**: Your original footage and AI outputs remain local

---

## 🎯 Features

### Core Video Editing

- Timeline-based editing
- Multi-track support (video, audio, text, stickers)
- Real-time preview
- No watermarks or subscriptions

### AI Generation (via ComfyUI)

- **Text-to-Video**: Generate video clips from text prompts
- **Text-to-Image**: Create images from text descriptions
- **Image-to-Video**: Animate images with AI
- **Image-to-Image**: Apply AI styles and transformations
- **Custom Workflows**: Use pre-built or create your own ComfyUI workflows

---

## 📦 Project Structure

```
obenbut/
├── apps/web/              # Main Next.js web application
│   ├── src/
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # UI and editor components
│   │   ├── constants/    # Application constants
│   │   ├── core/         # Editor core (singleton)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility and API logic
│   │   │   ├── api/      # API routes and providers
│   │   │   │   └── comfyui/     # ComfyUI integration
│   │   │   └── ...
│   │   ├── services/     # Background services
│   │   ├── stores/       # State management (Zustand)
│   │   └── types/        # TypeScript types
├── docker/               # Docker configurations for ComfyUI
├── public/               # Static assets
│   └── workflows/        # Pre-built ComfyUI workflows
├── packages/             # Shared packages
│   ├── env/              # Environment variable definitions
│   └── ui/               # Shared UI components
└── tests/                # Test suite
```

---

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/docs/installation) (recommended) or Node.js 18+
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (optional, for AI features)

### Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/bowfeng/ObenCut.git
cd ObenCut
```

#### 2. Install Dependencies

```bash
bun install
```

#### 3. Configure Environment

```bash
# Copy environment file
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://localhost:6379"

# ComfyUI (for AI features)
COMFYUI_URL="http://localhost:8188"
```

#### 4. Start the Development Server

```bash
# Start database and Redis (optional, for full local setup)
docker compose up -d db redis serverless-redis-http

# Start the web app
bun dev:web
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🤖 ComfyUI Setup

To use AI generation features, you need to run ComfyUI:

```bash
# Using CPU (slower, but simpler)
docker compose -f docker-compose-cpu.yml up -d

# Using GPU (faster, requires NVIDIA GPU)
docker compose -f docker-compose-gpu.yml up -d
```

ComfyUI will be available at [http://localhost:8188](http://localhost:8188).

### Available Workflows

The repository includes pre-built ComfyUI workflows in `public/workflows/`:

- `text2image.json` - Generate images from text
- `text2video.json` - Generate video from text
- `image2image.json` - Transform images with AI
- `image2video.json` - Animate images to video

---

## 🎨 AI Generation Features

### How to Use AI Generation in ObenCut

1. Open the **Assets Panel** in the editor
2. Select the **AI Generation** tab
3. Choose a workflow (Text-to-Image, Text-to-Video, etc.)
4. Enter your prompt and adjust settings
5. Click **Generate**
6. AI-generated content will be added to your assets library

### Custom Workflows

You can extend AI capabilities by:

1. Creating your own ComfyUI workflow in the ComfyUI interface
2. Exporting the workflow JSON
3. Placing it in `public/workflows/`
4. Registering it in the AI generation store

---

## 🚀 Coming Soon

- [ ] More AI workflows for video editing
- [ ] AI-based background removal
- [ ] AI color grading
- [ ] AI voice synthesis and lip-sync
- [ ] Real-time AI effects during preview
- [ ] Mobile app support

---

## 🤝 Contributing

We welcome contributions! ObenCut is built on the foundation of [OpenCut](https://github.com/OpenCut-app/OpenCut), which has an active community.

**Great areas to contribute:**

- Adding new AI generation workflows
- Improving ComfyUI integration
- UI/UX improvements for AI features
- Performance optimizations
- Bug fixes

See our [Contributing Guide](.github/CONTRIBUTING.md) for detailed setup instructions and development guidelines.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

ObenCut is a fork of [OpenCut](https://github.com/OpenCut-app/OpenCut), which is also MIT licensed.

---

<div align="center">

**Built with ❤️ using [OpenCut](https://github.com/OpenCut-app/OpenCut) + [ComfyUI](https://github.com/comfyanonymous/ComfyUI)**

*Star history chart coming soon!*

</div>