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

type Mode = null | "own";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastImageId, setLastImageId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);

  // Own-mode state
  const [cardCaption, setCardCaption] = useState("");
  const [finalizedCaptions, setFinalizedCaptions] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastImageId");
    if (stored) setLastImageId(stored);
  }, []);

  useEffect(() => {
    if (mode === "own") {
      setTimeout(() => captionRef.current?.focus(), 100);
    }
  }, [mode]);

  function pickFile(picked: File) {
    if (!SUPPORTED_TYPES.includes(picked.type)) {
      setError("Unsupported file type. Please use JPEG, PNG, WebP, GIF, or HEIC.");
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setError("");
    setMode(null);
    setCardCaption("");
    setFinalizedCaptions([]);
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

  function resetImage() {
    setFile(null);
    setPreview(null);
    setError("");
    setMode(null);
    setCardCaption("");
    setFinalizedCaptions([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function finalizeCaption() {
    const trimmed = cardCaption.trim();
    if (!trimmed) return;
    setFinalizedCaptions((prev) => [...prev, trimmed]);
    setCardCaption("");
    setTimeout(() => captionRef.current?.focus(), 50);
  }

  function handleCaptionKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      finalizeCaption();
    }
  }

  async function uploadAndRegister(): Promise<{ imageId: string; cdnUrl: string } | null> {
    if (!file) return null;
    setIsUploading(true);
    setError("");

    const presignRes = await fetch("/api/pipeline/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type }),
    });
    const presignData = await presignRes.json();
    if (!presignRes.ok) {
      setError(presignData.error ?? "Failed to get upload URL");
      setIsUploading(false);
      return null;
    }
    const { presignedUrl, cdnUrl } = presignData;

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadRes.ok) {
      setError(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
      setIsUploading(false);
      return null;
    }

    const registerRes = await fetch("/api/pipeline/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: cdnUrl }),
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      setError(registerData.error ?? "Failed to register image");
      setIsUploading(false);
      return null;
    }

    return { imageId: registerData.imageId as string, cdnUrl };
  }

  async function handleGenerate() {
    const result = await uploadAndRegister();
    if (!result) return;

    fetch("/api/pipeline/generate-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: result.imageId }),
    });

    localStorage.setItem("lastImageId", result.imageId);
    router.push(`/my-captions?imageId=${result.imageId}`);
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <main className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold">Generate captions</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Upload a photo and choose how to caption it
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

        {/* Drop zone — hidden in own mode (image lives in the cards) */}
        {mode !== "own" && (
          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              isDragOver
                ? "border-violet-500 bg-violet-500/5"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
            onClick={() => !isUploading && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-72 rounded-xl object-contain" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl">🖼️</div>
                <div className="text-center">
                  <p className="text-zinc-300 text-sm font-medium">Drop an image or click to browse</p>
                  <p className="text-zinc-600 text-xs mt-1">JPEG, PNG, WebP, GIF, HEIC</p>
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Mode chooser + panels */}
        {file && (
          <>
            {/* Mode picker */}
            {mode === null && (
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("own")}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm font-medium transition-colors"
                >
                  ✍️ Write my own
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isUploading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                    : "✨ Generate with AI"}
                </button>
              </div>
            )}

            {/* ── Write your own mode ── */}
            {mode === "own" && (
              <div className="flex flex-col gap-4">
                {/* Finalized caption cards */}
                {finalizedCaptions.map((caption, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg">
                    <img src={preview!} alt="Your image" className="w-full max-h-64 object-cover" />
                    <div className="px-4 py-3 border-t border-zinc-800">
                      <p className="text-white text-sm leading-relaxed">{caption}</p>
                    </div>
                  </div>
                ))}

                {/* Input card */}
                <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 focus-within:border-fuchsia-500/50 transition-colors shadow-lg">
                  <img src={preview!} alt="Your image" className="w-full max-h-64 object-cover" />
                  <div className="px-4 pt-3 pb-2 border-t border-zinc-800">
                    <textarea
                      ref={captionRef}
                      value={cardCaption}
                      onChange={(e) => setCardCaption(e.target.value)}
                      onKeyDown={handleCaptionKeyDown}
                      placeholder={
                        finalizedCaptions.length > 0
                          ? "Write another caption… (Enter to finalize)"
                          : "Write your caption… (Enter to finalize)"
                      }
                      maxLength={300}
                      rows={2}
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 resize-none focus:outline-none"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-zinc-600 text-xs">{cardCaption.length}/300</span>
                      <button
                        onClick={finalizeCaption}
                        disabled={!cardCaption.trim()}
                        className="text-xs px-3 py-1 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        ✓ Done
                      </button>
                    </div>
                  </div>
                </div>

                {/* Switch / reset buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={resetImage}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm font-medium transition-colors"
                  >
                    🖼️ Use another image
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isUploading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white text-sm font-semibold text-center transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                      : "✨ Switch to AI"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-400 px-1">{error}</p>}
      </main>
    </div>
  );
}
