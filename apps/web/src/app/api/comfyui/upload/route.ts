import { NextRequest, NextResponse } from "next/server";
import { webEnv } from "@opencut/env/web";

/**
 * POST /api/comfyui/upload
 * Proxy for uploading files to ComfyUI's /upload endpoint
 * This bypasses CORS restrictions by making the request from the server
 */
export async function POST(request: NextRequest) {
  try {
    const comfyuiUrl = webEnv.COMFYUI_URL;
    if (!comfyuiUrl) {
      return NextResponse.json(
        { error: "ComfyUI URL is not configured" },
        { status: 500 }
      );
    }

    // Get the file from FormData
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const overwrite = formData.get("overwrite") ?? "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Build the ComfyUI upload URL
    const uploadUrl = `${comfyuiUrl}/upload`;

    // Create a new FormData for the outbound request
    const outboundFormData = new FormData();
    outboundFormData.append("image", file);
    outboundFormData.append("overwrite", String(overwrite));

    // Make the request to ComfyUI from the server (no CORS issues)
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: outboundFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ComfyUI upload error:", response.status, errorText);
      return NextResponse.json(
        {
          error: "Failed to upload to ComfyUI",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading to ComfyUI:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}