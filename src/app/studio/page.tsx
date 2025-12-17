"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  IMAGE_MODELS,
  IMAGE_SIZES,
  GENERATION_MODELS,
  VARIATION_MODELS,
  ImageModel,
  ImageSize,
} from "@/lib/models";

type Mode = "generate" | "edit";

type GeneratedImage = {
  id: string;
  prompt: string;
  width: number;
  height: number;
  url: string;
  model: string;
  provider: string;
  createdAt: string;
};

function getModelLabel(modelId: string): string {
  const model = IMAGE_MODELS.find((m) => m.id === modelId);
  return model?.label ?? modelId;
}

function getAspectRatioClass(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.2) return "aspect-[1440/1024]";
  if (ratio < 0.8) return "aspect-[1024/1440]";
  return "aspect-square";
}

// Mode Toggle Component
function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-full bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 p-1">
      <button
        type="button"
        onClick={() => onChange("generate")}
        disabled={disabled}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
          mode === "generate"
            ? "bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm"
            : "text-zinc-400 hover:text-zinc-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Generate
      </button>
      <button
        type="button"
        onClick={() => onChange("edit")}
        disabled={disabled}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
          mode === "edit"
            ? "bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm"
            : "text-zinc-400 hover:text-zinc-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        Edit
      </button>
    </div>
  );
}

export default function StudioPage() {
  // Mode state
  const [mode, setMode] = useState<Mode>("generate");

  // Shared state
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate mode state
  const [generateModel, setGenerateModel] = useState<ImageModel>(
    GENERATION_MODELS[0]?.id as ImageModel
  );
  const [size, setSize] = useState<ImageSize>("1024x1024");

  // Edit mode state
  const [editModel, setEditModel] = useState<ImageModel>(
    VARIATION_MODELS[0]?.id as ImageModel
  );
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [similarityStrength, setSimilarityStrength] = useState(0.7);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      setIsLoadingImages(true);
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
    } finally {
      setIsLoadingImages(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    setSourceImagePreview(URL.createObjectURL(file));

    // Read as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setSourceImage(base64);
    };
    reader.readAsDataURL(file);
  }

  function clearSourceImage() {
    setSourceImage(null);
    setSourceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, model: generateModel }),
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
      setIsProcessing(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !sourceImage || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/images/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImage,
          prompt,
          model: editModel,
          similarityStrength,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/login";
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit image");
      }

      const newImage = await res.json();
      setImages((prev) => [newImage, ...prev]);
      setPrompt("");
      clearSourceImage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload(img: GeneratedImage) {
    const link = document.createElement("a");
    link.href = `/api/images/${img.id}/download`;
    link.download = `image-${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleUseAsSource(img: GeneratedImage) {
    // Fetch through our API to avoid CORS issues with S3
    fetch(`/api/images/${img.id}/download`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch image");
        return res.blob();
      })
      .then((blob) => {
        // Create a local URL for preview
        setSourceImagePreview(URL.createObjectURL(blob));
        // Convert to base64 for the API
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setSourceImage(base64);
          setMode("edit");
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.error("Failed to load image:", err);
        setError("Failed to load image for editing");
      });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-emerald-400">Image</span> Studio
          </h1>
          <ModeToggle mode={mode} onChange={setMode} disabled={isProcessing} />
          <a
            href="/api/auth/logout"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Forms Section */}
        <section className="mb-12">
          {mode === "generate" ? (
            /* Generate Form */
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-400">Model:</label>
                  <select
                    value={generateModel}
                    onChange={(e) => setGenerateModel(e.target.value as ImageModel)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    disabled={isProcessing}
                  >
                    {GENERATION_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
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
                    disabled={isProcessing}
                  >
                    {IMAGE_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!prompt.trim() || isProcessing}
                  className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Edit Form */
            <form onSubmit={handleEdit} className="space-y-4">
              {/* Image Upload Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-4 transition-colors ${
                    sourceImagePreview
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  {sourceImagePreview ? (
                    <div className="relative aspect-square">
                      <Image
                        src={sourceImagePreview}
                        alt="Source image"
                        fill
                        className="object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={clearSourceImage}
                        className="absolute top-2 right-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 p-1.5 rounded-lg transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square cursor-pointer">
                      <svg className="h-12 w-12 text-zinc-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-zinc-400 text-sm">Click to upload source image</span>
                      <span className="text-zinc-500 text-xs mt-1">or drag and drop</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe how you want to modify the image..."
                    rows={4}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all"
                    disabled={isProcessing}
                  />

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-400">Model:</label>
                    <select
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value as ImageModel)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      disabled={isProcessing}
                    >
                      {VARIATION_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-400">Similarity:</label>
                      <span className="text-sm text-zinc-300">{Math.round(similarityStrength * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.1"
                      value={similarityStrength}
                      onChange={(e) => setSimilarityStrength(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                      disabled={isProcessing}
                    />
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>More creative</span>
                      <span>More similar</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || !sourceImage || isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Variation...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Create Variation
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </section>

        {/* Gallery */}
        <section>
          <h2 className="text-lg font-medium text-zinc-300 mb-6">Your Creations</h2>

          {isLoadingImages ? (
            <div className="text-center py-16 text-zinc-500">
              <svg className="animate-spin mx-auto h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p>Loading your images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                  <div className={`relative ${getAspectRatioClass(img.width, img.height)} bg-zinc-800`}>
                    <Image
                      src={img.url}
                      alt={img.prompt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {/* Overlay buttons */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDownload(img)}
                        className="bg-white/90 hover:bg-white text-zinc-900 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      {VARIATION_MODELS.length > 0 && (
                        <button
                          onClick={() => handleUseAsSource(img)}
                          className="bg-emerald-500/90 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Vary
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-zinc-300 line-clamp-2">{img.prompt}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
                        {getModelLabel(img.model)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/50 text-zinc-400">
                        {img.provider}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/50 text-zinc-400">
                        {img.width}×{img.height}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/50 text-zinc-400">
                        {new Date(img.createdAt).toLocaleDateString()}
                      </span>
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
