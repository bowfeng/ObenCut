import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface AudioWaveformProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  audioFile?: File;
  height?: number;
  className?: string;
}

function extractPeaks({
  buffer,
  length = 512,
}: {
  buffer: AudioBuffer;
  length?: number;
}): number[][] {
  const channels = buffer.numberOfChannels;
  const peaks: number[][] = [];

  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    const step = Math.floor(data.length / length);
    const channelPeaks: number[] = [];

    for (let i = 0; i < length; i++) {
      const start = i * step;
      const end = Math.min(start + step, data.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(data[j]);
        if (abs > max) max = abs;
      }
      channelPeaks.push(max);
    }
    peaks.push(channelPeaks);
  }

  return peaks;
}

async function decodeAudioFromFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext)();
  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    audioContext.close();
  }
}

export function AudioWaveform({
  audioUrl,
  audioBuffer,
  audioFile,
  height = 32,
  className = "",
}: AudioWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const ws = wavesurfer.current;

    const initWaveSurfer = async () => {
      if (!waveformRef.current) return;

      // Clean up previous instance
      if (ws) {
        ws.destroy();
        wavesurfer.current = null;
      }

      const newWaveSurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "rgba(255, 255, 255, 0.6)",
        progressColor: "rgba(255, 255, 255, 0.9)",
        cursorColor: "transparent",
        barWidth: 2,
        barGap: 1,
        height,
        normalize: true,
        interact: false,
      });

      if (!mounted) {
        newWaveSurfer.destroy();
        return;
      }

      wavesurfer.current = newWaveSurfer;

      newWaveSurfer.on("ready", () => {
        if (mounted) {
          setIsLoading(false);
          setError(false);
        }
      });

      newWaveSurfer.on("error", (err) => {
        if (mounted) {
          console.error("WaveSurfer error:", err);
          setError(true);
          setIsLoading(false);
        }
      });

      try {
        // Priority: audioBuffer > audioFile > audioUrl
        if (audioBuffer) {
          // In-memory AudioBuffer - most stable
          const peaks = extractPeaks({ buffer: audioBuffer });
          await newWaveSurfer.load("", peaks, audioBuffer.duration);
        } else if (audioFile) {
          // File object - stable across re-renders, not affected by blob URL revocation
          const decodedBuffer = await decodeAudioFromFile(audioFile);
          const peaks = extractPeaks({ buffer: decodedBuffer });
          await newWaveSurfer.load("", peaks, decodedBuffer.duration);
        } else if (audioUrl) {
          // Fallback to blob URL (for library audio)
          const audioContext = new (window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext)();
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const peaks = extractPeaks({ buffer: decodedBuffer });
          await newWaveSurfer.load("", peaks, decodedBuffer.duration);
          audioContext.close();
        } else {
          setIsLoading(false);
        }
      } catch (loadErr) {
        if (mounted) {
          console.error("WaveSurfer load error:", loadErr);
          setError(true);
          setIsLoading(false);
        }
      }
    };

    initWaveSurfer();

    return () => {
      mounted = false;
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioBuffer, audioFile, audioUrl, height]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <span className="text-foreground/60 text-xs">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-foreground/60 text-xs">Loading...</span>
        </div>
      )}
      <div
        ref={waveformRef}
        className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}
        style={{ height }}
      />
    </div>
  );
}

export default AudioWaveform;
