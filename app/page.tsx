"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GenerationPhase = "idle" | "preparing" | "rendering" | "encoding" | "complete" | "error";

type VisualStyle =
  | "cosmic"
  | "tropical"
  | "noir"
  | "sunrise"
  | "aqua"
  | "mono";

interface GenerationSettings {
  fps: number;
  segmentSeconds: number;
  style: VisualStyle;
}

interface TimelineSlice {
  sentence: string;
  index: number;
  palette: [string, string];
}

const DEFAULT_PROMPT =
  "A flowing introduction for an AI demo reel that highlights innovation, creativity, and futuristic design with subtle particle motion and layered typography.";

const STYLE_PALETTES: Record<VisualStyle, [string, string][]> = {
  cosmic: [
    ["#1b0033", "#5c00b3"],
    ["#0b1a4a", "#170e75"],
    ["#2a0a4a", "#4a117a"],
    ["#05010f", "#2d1c7a"],
  ],
  tropical: [
    ["#ff8a5c", "#ffd452"],
    ["#ff6b6b", "#ffd166"],
    ["#ffbe0b", "#ffb4a2"],
    ["#ff9f1c", "#ffbf69"],
  ],
  noir: [
    ["#0b0b0b", "#1f1f1f"],
    ["#111111", "#2b2b2b"],
    ["#090909", "#202020"],
    ["#131313", "#292929"],
  ],
  sunrise: [
    ["#ff758f", "#ffe2e2"],
    ["#ff9b73", "#ffc773"],
    ["#ff6f91", "#ff9671"],
    ["#f9ada0", "#f8ede3"],
  ],
  aqua: [
    ["#003f5c", "#2f4b7c"],
    ["#005377", "#3185fc"],
    ["#2f4b7c", "#00b8a9"],
    ["#1f4068", "#2a9d8f"],
  ],
  mono: [
    ["#111827", "#374151"],
    ["#0f172a", "#1f2937"],
    ["#18181b", "#27272a"],
    ["#1a202c", "#2d3748"],
  ],
};

function splitSentences(input: string): string[] {
  return input
    .split(/[\n\.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function createPaletteTimeline(sentences: string[], style: VisualStyle): TimelineSlice[] {
  const palettes = STYLE_PALETTES[style];
  return sentences.map((sentence, index) => ({
    sentence,
    index,
    palette: palettes[index % palettes.length],
  }));
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const tentative = line ? `${line} ${word}` : word;
    if (ctx.measureText(tentative).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = tentative;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: [string, string],
  phase: number,
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = `rgba(255, 255, 255, 0.08)`;
  const waveCount = 4;
  for (let i = 0; i < waveCount; i++) {
    const offset = (phase + i * 0.5) % (2 * Math.PI);
    ctx.beginPath();
    const amplitude = height * 0.08 * (1 - i * 0.15);
    ctx.moveTo(0, height * 0.2 * (i + 1));
    const segments = 8;
    for (let s = 0; s <= segments; s++) {
      const x = (s / segments) * width;
      const y =
        height * 0.15 * (i + 1) +
        Math.sin(offset + (s / segments) * Math.PI * 2) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }
}

async function renderTimelineToVideo(
  canvas: HTMLCanvasElement,
  timeline: TimelineSlice[],
  settings: GenerationSettings,
  onProgress: (complete: number) => void,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context is not available.");
  }

  const fps = settings.fps;
  const segmentFrames = fps * settings.segmentSeconds;
  const totalFrames = segmentFrames * timeline.length;
  let currentFrame = 0;

  const textAreaWidth = canvas.width * 0.7;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  while (currentFrame < totalFrames) {
    const sliceIndex = Math.floor(currentFrame / segmentFrames);
    const frameInSlice = currentFrame % segmentFrames;
    const sliceProgress = frameInSlice / segmentFrames;
    const slice = timeline[sliceIndex];
    const oscillation = Math.sin(sliceProgress * Math.PI * 2);

    drawGradientBackground(
      ctx,
      canvas.width,
      canvas.height,
      slice.palette,
      sliceProgress * Math.PI * 2,
    );

    const titleOpacity = Math.sin(Math.PI * Math.min(sliceProgress, 1 - sliceProgress));
    ctx.globalAlpha = Math.max(0.2, titleOpacity);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `${Math.round(canvas.height * 0.06)}px 'Space Grotesk', sans-serif`;
    ctx.fillText("AI Concept Visualizer", centerX, canvas.height * 0.18);

    ctx.globalAlpha = 1;
    ctx.font = `${Math.round(canvas.height * 0.14)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillText(String(sliceIndex + 1).padStart(2, "0"), centerX, canvas.height * 0.82);

    const displacement = Math.sin(sliceProgress * Math.PI) * canvas.height * 0.03;
    ctx.font = `${Math.round(canvas.height * 0.07)}px 'DM Sans', sans-serif`;
    const lines = wrapLines(ctx, slice.sentence, textAreaWidth);
    const lineHeight = canvas.height * 0.1;
    const totalHeight = lineHeight * lines.length;

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    lines.forEach((line, lineIndex) => {
      const alpha = Math.max(
        0,
        1 -
          Math.abs(
            sliceProgress - lineIndex / Math.max(1, lines.length - 1),
          ) *
            2.4,
      );
      ctx.globalAlpha = Math.max(alpha, 0.15);
      const y =
        centerY -
        totalHeight / 2 +
        lineIndex * lineHeight +
        displacement * (lineIndex - (lines.length - 1) / 2);
      ctx.fillText(line, centerX, y);
    });

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    const orbitRadius = canvas.height * 0.42;
    const satelliteCount = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < satelliteCount; i++) {
      const angle = sliceProgress * Math.PI * 2 + (i / satelliteCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.4 * Math.sin(angle + oscillation)})`;
      ctx.arc(x, y, canvas.height * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    currentFrame += 1;
    onProgress(currentFrame / totalFrames);
    await sleep(1000 / fps);
  }
}

function pickMimeType() {
  if (typeof window === "undefined") {
    return null;
  }
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<VisualStyle>("cosmic");
  const [segmentSeconds, setSegmentSeconds] = useState(3);
  const [fps, setFps] = useState(24);
  const clipboardAvailable =
    typeof navigator !== "undefined" && !!navigator.clipboard;

  const sentences = useMemo(() => splitSentences(prompt), [prompt]);
  const timeline = useMemo(
    () => createPaletteTimeline(sentences, style),
    [sentences, style],
  );

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const canGenerate = sentences.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setVideoUrl(null);
    setError(null);
    setPhase("preparing");
    setProgress(0);

    try {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }

      if (typeof window === "undefined" || !window.MediaRecorder) {
        throw new Error("MediaRecorder is not available in this environment.");
      }
      const mimeType = pickMimeType();
      if (!mimeType) {
        throw new Error("No supported video MIME type found for this browser.");
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("The rendering surface could not be prepared.");
      }

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
      const chunks: BlobPart[] = [];
      const videoPromise = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onerror = (event) => {
          const message = event.error?.message ?? "An unknown recording error occurred.";
          reject(new Error(message));
        };
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
      });

      setPhase("rendering");
      recorder.start();

      await renderTimelineToVideo(
        canvas,
        timeline,
        { fps, segmentSeconds, style },
        (ratio) => setProgress(ratio),
      );

      setPhase("encoding");
      recorder.stop();

      const blob = await videoPromise;
      setPhase("complete");
      setProgress(1);
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setPhase("error");
      setError(err instanceof Error ? err.message : "Failed to generate video.");
    }
  };

  const reset = () => {
    setVideoUrl(null);
    setProgress(0);
    setPhase("idle");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-400/80">
              Nebula Studio
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Text-to-Video Synthesizer
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Transform storyboards, scripts, or marketing copy into animated concept
              previews in minutes. The on-device compositor builds gradient-rich motion
              that is ready to share instantly.
            </p>
          </div>
          <button
            onClick={reset}
            className="self-start rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-indigo-400/60 hover:text-white"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 lg:flex-row">
        <section className="flex w-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-indigo-500/5 backdrop-blur">
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
              Narrative Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-[160px] rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-zinc-100 shadow-inner shadow-black/20 transition focus:border-indigo-400/60 focus:outline-none focus:ring-0"
              placeholder="Describe the motion you want to see..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
                Visual Style
              </label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {Object.keys(STYLE_PALETTES).map((value) => {
                  const palette = STYLE_PALETTES[value as VisualStyle][0];
                  return (
                    <button
                      key={value}
                      onClick={() => setStyle(value as VisualStyle)}
                      className={`rounded-2xl border border-white/15 p-3 transition hover:border-white/40 ${
                        style === value ? "ring-2 ring-indigo-400/80" : ""
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
                      }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest text-white drop-shadow">
                        {value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-black/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
                  Segment Seconds
                </span>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={segmentSeconds}
                  onChange={(event) => setSegmentSeconds(Number(event.target.value))}
                  className="accent-indigo-400"
                />
                <span className="text-sm text-zinc-300">{segmentSeconds} sec / beat</span>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-black/40 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
                  Frames per Second
                </span>
                <input
                  type="range"
                  min={12}
                  max={60}
                  step={6}
                  value={fps}
                  onChange={(event) => setFps(Number(event.target.value))}
                  className="accent-indigo-400"
                />
                <span className="text-sm text-zinc-300">{fps} fps capture</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-xs text-zinc-400">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Production Timeline
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {timeline.map((slice) => (
                <div key={slice.index} className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 flex-shrink-0 rounded-xl border border-white/10 shadow-inner shadow-black/40"
                    style={{
                      background: `linear-gradient(135deg, ${slice.palette[0]}, ${slice.palette[1]})`,
                    }}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                      Scene {String(slice.index + 1).padStart(2, "0")}
                    </p>
                    <p className="text-sm text-white/80">{slice.sentence}</p>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Add descriptive prose above to build your scene list. Each sentence
                  becomes a unique animated beat in the final render.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || phase === "rendering" || phase === "encoding"}
            className="relative flex items-center justify-center gap-3 rounded-full bg-indigo-500/90 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition enabled:hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-white/20"
          >
            {phase === "rendering" || phase === "encoding" ? "Generating..." : "Render"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        <section className="flex w-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl shadow-indigo-500/5 backdrop-blur">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-300">
              Render Monitor
            </h2>
            <p className="text-sm text-zinc-400">
              Watch the compositor animate typography, gradients, and orbital motion as your
              story plays out. Videos export in modern WebM for instant sharing.
            </p>
          </div>

          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/80">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                className="h-full w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center text-sm text-zinc-500">
                <div className="h-16 w-16 animate-pulse rounded-full bg-indigo-500/40" />
                <p>Generated clips will appear here. Start rendering to preview the output.</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-200">
              <span>Status</span>
              <span className="text-white/80">
                {phase === "idle" && "Idle"}
                {phase === "preparing" && "Preparing Canvas"}
                {phase === "rendering" && "Rendering Frames"}
                {phase === "encoding" && "Encoding Clip"}
                {phase === "complete" && "Complete"}
                {phase === "error" && "Error"}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 via-indigo-300 to-sky-300 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>{Math.round(progress * 100)}%</span>
              <span>{timeline.length} scenes</span>
            </div>
          </div>

          {videoUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={videoUrl}
                download="nebula-synth.webm"
                className="rounded-full border border-indigo-400/60 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200 transition hover:border-indigo-300 hover:text-white"
              >
                Download Clip
              </a>
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-300 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-zinc-500"
                disabled={!clipboardAvailable}
                onClick={() => {
                  if (typeof navigator === "undefined" || !navigator.clipboard) {
                    setError("Clipboard access is not available in this environment.");
                    return;
                  }
                  navigator.clipboard
                    .writeText(videoUrl)
                    .then(() => setError(null))
                    .catch(() => setError("Failed to copy share URL."));
                }}
          >
            Copy Share Link
          </button>
        </div>
      )}

          <div className="mt-auto space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-zinc-500">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Tips
            </h3>
            <ul className="space-y-1 text-sm leading-relaxed text-zinc-400">
              <li>
                Combine short, vivid sentences to choreograph cinematic beats. Each
                sentence becomes its own animated scene.
              </li>
              <li>
                Increase the segment length for slower transitions, or dial the FPS higher
                for smooth, energetic motion graphics.
              </li>
              <li>
                The generator runs entirely in-browser using the MediaRecorder API, keeping
                your concepts private and export-ready.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
