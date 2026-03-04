"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

type Step = "idle" | "uploading" | "processing" | "generating" | "done" | "error";

const STEP_LABELS: Record<Step, string> = {
  idle: "",
  uploading: "Uploading image...",
  processing: "Processing image...",
  generating: "Generating captions...",
  done: "Done!",
  error: "",
};

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastImageId, setLastImageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastImageId");
    if (stored) setLastImageId(stored);
  }, []);

  function pickFile(picked: File) {
    if (!SUPPORTED_TYPES.includes(picked.type)) {
      setError("Unsupported file type. Please use JPEG, PNG, WebP, GIF, or HEIC.");
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setStep("idle");
    setError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) pickFile(picked);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const picked = e.dataTransfer.files?.[0];
    if (picked) pickFile(picked);
  }

  async function handleGenerate() {
    if (!file) return;
    setError("");

    // Step 1: Get presigned URL
    setStep("uploading");
    const presignRes = await fetch("/api/pipeline/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type }),
    });
    const presignData = await presignRes.json();
    if (!presignRes.ok) {
      setError(presignData.error ?? "Failed to get upload URL");
      setStep("error");
      return;
    }
    const { presignedUrl, cdnUrl } = presignData;

    // Step 2: Upload to S3
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok) {
      setError(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
      setStep("error");
      return;
    }

    // Step 3: Register image
    setStep("processing");
    const registerRes = await fetch("/api/pipeline/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: cdnUrl }),
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      setError(registerData.error ?? "Failed to register image");
      setStep("error");
      return;
    }
    const { imageId } = registerData;

    // Step 4: Generate captions
    setStep("generating");
    const captionsRes = await fetch("/api/pipeline/generate-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    const captionsData = await captionsRes.json();
    if (!captionsRes.ok) {
      setError(captionsData.error ?? "Failed to generate captions");
      setStep("error");
      return;
    }

    localStorage.setItem("lastImageId", imageId);
    setStep("done");
    router.push(`/my-captions?imageId=${imageId}`);
  }

  const isRunning = step === "uploading" || step === "processing" || step === "generating";

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <main className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold">Generate captions</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Upload a photo and we&apos;ll generate funny captions for it
          </p>
        </div>

        {/* Resume banner */}
        {lastImageId && !file && (
          <Link
            href={`/my-captions?imageId=${lastImageId}`}
            className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/15 transition-colors"
          >
            <div>
              <p className="text-violet-300 text-sm font-medium">Continue where you left off</p>
              <p className="text-violet-500 text-xs mt-0.5">You have a previous generation</p>
            </div>
            <span className="text-violet-400 text-sm">View &rarr;</span>
          </Link>
        )}

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            isDragOver
              ? "border-violet-500 bg-violet-500/5"
              : "border-zinc-700 hover:border-zinc-500"
          }`}
          onClick={() => !isRunning && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-72 rounded-xl object-contain"
            />
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl">
                🖼️
              </div>
              <div className="text-center">
                <p className="text-zinc-300 text-sm font-medium">
                  Drop an image or click to browse
                </p>
                <p className="text-zinc-600 text-xs mt-1">
                  JPEG, PNG, WebP, GIF, HEIC
                </p>
              </div>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Progress indicator */}
        {isRunning && (
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-sm text-zinc-300">{STEP_LABELS[step]}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 px-1">{error}</p>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!file || isRunning}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all text-sm shadow-lg shadow-violet-500/25"
        >
          {isRunning ? "Generating..." : "Generate Captions"}
        </button>
      </main>
    </div>
  );
}
