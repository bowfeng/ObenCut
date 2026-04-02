# ComfyUI AI Generation Setup Guide

## Problem: WebSocket Connection Failed

If you see errors like:
```
WebSocket connection to 'ws://http/ws?clientId=...' failed
GET http://http/prompt?clientId=...' failed
```

This indicates the `host` configuration is incorrect.

## Solution

### Option 1: Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and ensure correct values:

   **For local development (same machine):**
   ```bash
   COMFYUI_HOST=localhost
   COMFYUI_PORT=8188
   COMFYUI_PROTOCOL=http
   ```

   **For WSL2 users (Windows ComfyUI):**
   ```bash
   COMFYUI_HOST=host.docker.internal
   COMFYUI_PORT=8188
   COMFYUI_PROTOCOL=http
   ```

### Option 2: Docker Configuration

If using Docker, the ComfyUI service should be accessible from the host. Check `docker-compose.yml`:

```yaml
services:
  comfyui:
    container_name: comfyui
    build: .
    ports:
      - "8188:8188"  # Adjust port mapping
    environment:
      - COMFYUI_HOST=0.0.0.0
      - COMFYUI_PORT=8188
      - COMFYUI_PROTOCOL=http
```

Then update `.env`:
```bash
COMFYUI_HOST=localhost
COMFYUI_PORT=8188  # Match the port mapping
COMFYUI_PROTOCOL=http
```

### Option 3: Local Installation

If running ComfyUI locally:

1. Start ComfyUI:
   ```bash
   python main.py --listen 0.0.0.0 --port 8188
   ```

2. Update `.env`:
   ```bash
   COMFYUI_HOST=localhost
   COMFYUI_PORT=8188
   COMFYUI_PROTOCOL=http
   ```

## Port Configuration

The system supports the following ComfyUI ports:
- **8188** - Default port (used if port is not set or is invalid)
- **8188** - Common port (will be used if configured)
- Any valid port in the range 1-65535

### Example .env Configuration
```bash
# Using default port 8188
COMFYUI_HOST=localhost
COMFYUI_PORT=
COMFYUI_PROTOCOL=http

# Using port 8188
COMFYUI_HOST=localhost
COMFYUI_PORT=8188
COMFYUI_PROTOCOL=http

# Using custom port
COMFYUI_HOST=localhost
COMFYUI_PORT=9000
COMFYUI_PROTOCOL=http
```

**Note**: If `COMFYUI_PORT` is not set, the system will use 8188 as the default. Invalid ports (like 0 or NaN) will also default to 8188.

## Diagnosing the Issue

Check the browser console logs - you should see:
```
[AIProviderFactory] ComfyUI configuration: { host: 'localhost', port: 8188, protocol: 'http' }
[ComfyUIProvider] Creating wrapper with config: { host: 'localhost', port: 8188, protocol: 'http' }
[ComfyUI] Initializing with config: { host: 'localhost', port: 8188, protocol: 'http', fullUrl: 'http://localhost:8188' }
[ComfyUI] Connecting to http://localhost:8188...
```

## Common Mistakes

❌ **Wrong:**
```bash
COMFYUI_HOST=http  # This becomes the URL: http://http:8188
COMFYUI_PROTOCOL=https  # Must be http or https
```

✅ **Correct:**
```bash
COMFYUI_HOST=localhost
COMFYUI_PORT=8188
COMFYUI_PROTOCOL=http
```

## Troubleshooting

1. **Check if ComfyUI is running:**
   ```bash
   curl http://localhost:8188/queue
   ```
   Should return JSON: `{ "queue_running": [], "queue_pending": [] }`

2. **Check browser console:**
   Look for `[ComfyUI]` logs to see what configuration is being used

3. **Verify port mapping (Docker):**
   Ensure the host port matches the application port

4. **Check firewall:**
   Make sure the port is not blocked by firewall