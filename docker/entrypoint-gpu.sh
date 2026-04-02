#!/bin/bash

# GPU entrypoint - no modifications, let ComfyUI auto-detect GPU

# Start ComfyUI with GPU support and enable CORS
exec python main.py --listen 0.0.0.0 --enable-cors-header "*" --enable-manager