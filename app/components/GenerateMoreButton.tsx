"use client";

import { useState } from "react";

export default function GenerateMoreButton({ imageId }: { imageId: string }) {
  const [triggered, setTriggered] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (triggered) return;
    setTriggered(true);
    setError("");

    const res = await fetch("/api/pipeline/generate-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to generate captions");
      setTriggered(false); // re-enable only on error
    }
    // On success: stay disabled — polling on my-captions will surface new captions
  }

  return (
    <div className="flex flex-col gap-1 flex-1">
      <button
        onClick={handleClick}
        disabled={triggered}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white text-sm font-medium text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
      >
        {triggered ? "Captions incoming…" : "Generate more captions"}
      </button>
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  );
}
