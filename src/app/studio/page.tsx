"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type GeneratedImage = {
  id: string;
  prompt: string;
  width: number;
  height: number;
  url: string;
  createdAt: string;
};

type ImageSize = "1024x1024" | "1024x1440" | "1440x1024";
type ImageModel = "FLUX-1.1-pro";

const SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: "1024x1024", label: "Square (1024×1024)" },
  { value: "1024x1440", label: "Portrait (1024×1440)" },
  { value: "1440x1024", label: "Landscape (1440×1024)" },
];

const MODEL_OPTIONS: { value: ImageModel; label: string }[] = [
  { value: "FLUX-1.1-pro", label: "FLUX 1.1 Pro" },
];

function getAspectRatioClass(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.2) return "aspect-[1440/1024]"; // Landscape
  if (ratio < 0.8) return "aspect-[1024/1440]"; // Portrait
  return "aspect-square"; // Square
}

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [model, setModel] = useState<ImageModel>("FLUX-1.1-pro");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const res = await fetch("/api/images");
      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, model }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate image");
      }

      const newImage = await res.json();
      setImages((prev) => [newImage, ...prev]);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload(img: GeneratedImage) {
    // Use the API endpoint to download (avoids CORS issues with S3)
    const link = document.createElement("a");
    link.href = `/api/images/${img.id}/download`;
    link.download = `image-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-emerald-400">Image</span> Studio
          </h1>
          <a
            href="/api/auth/logout"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Generation Form */}
        <section className="mb-12">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all"
                disabled={isGenerating}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-400">Model:</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as ImageModel)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  disabled={isGenerating}
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-400">Size:</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as ImageSize)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  disabled={isGenerating}
                >
                  {SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </form>
        </section>

        {/* Gallery */}
        <section>
          <h2 className="text-lg font-medium text-zinc-300 mb-6">
            Your Creations
          </h2>

          {images.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <svg
                className="mx-auto h-12 w-12 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>No images yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors break-inside-avoid"
                >
                  <div
                    className={`relative ${getAspectRatioClass(img.width, img.height)} bg-zinc-800`}
                  >
                    <Image
                      src={img.url}
                      alt={img.prompt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Download button overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDownload(img)}
                        className="bg-white/90 hover:bg-white text-zinc-900 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-zinc-300 line-clamp-2">
                      {img.prompt}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-zinc-500">
                        {img.width}×{img.height} •{" "}
                        {new Date(img.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleDownload(img)}
                        className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
