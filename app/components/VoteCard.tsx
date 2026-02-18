"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type CaptionWithImage = {
  id: string;
  content: string;
  image_id: string;
  images: {
    id: string;
    url: string;
    image_description: string | null;
  };
};

type VoteHistory = {
  caption: CaptionWithImage;
  vote_value: number;
};

export default function VoteCard({
  initialCaptions,
}: {
  initialCaptions: CaptionWithImage[];
}) {
  const [queue, setQueue] = useState<CaptionWithImage[]>(initialCaptions);
  const [lastVote, setLastVote] = useState<VoteHistory | null>(null);
  const [votedCaptionIds, setVotedCaptionIds] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const current = queue[0] ?? null;

  // Preload next image
  useEffect(() => {
    if (queue[1]?.images?.url) {
      const img = new Image();
      img.src = queue[1].images.url;
    }
  }, [queue]);

  // Fetch more when buffer is low
  const fetchMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/captions/unvoted");
      if (res.ok) {
        const data: CaptionWithImage[] = await res.json();
        if (data.length > 0) {
          setQueue((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newCaptions = data.filter(
              (c) =>
                !existingIds.has(c.id) &&
                c.content &&
                c.images?.url
            );
            return [...prev, ...newCaptions];
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (queue.length < 3 && !isLoading) {
      fetchMore();
    }
  }, [queue.length, isLoading, fetchMore]);

  const submitVote = async (caption: CaptionWithImage, voteValue: number) => {
    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption_id: caption.id, vote_value: voteValue }),
    });
  };

  const updateVote = async (captionId: string, voteValue: number) => {
    await fetch("/api/vote", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption_id: captionId, vote_value: voteValue }),
    });
  };

  const animateAndVote = useCallback(
    async (direction: "left" | "right") => {
      if (!current || isAnimating) return;

      const voteValue = direction === "right" ? 1 : -1;
      setExitDirection(direction);
      setIsAnimating(true);

      // Wait for exit animation
      await new Promise((r) => setTimeout(r, 300));

      setLastVote({ caption: current, vote_value: voteValue });
      setVotedCaptionIds((prev) => new Set(prev).add(current.id));
      setQueue((prev) => prev.slice(1));
      setExitDirection(null);
      setDragX(0);
      setIsAnimating(false);

      // If this caption already has a row in the DB (re-vote after undo), update it
      if (votedCaptionIds.has(current.id)) {
        updateVote(current.id, voteValue);
      } else {
        submitVote(current, voteValue);
      }
    },
    [current, isAnimating]
  );

  const handleUndo = useCallback(async () => {
    if (!lastVote) return;

    // Put the card back at the front of the queue
    setQueue((prev) => [lastVote.caption, ...prev]);

    // Update the existing row to flip the vote
    const flippedValue = lastVote.vote_value === 1 ? -1 : 1;
    await updateVote(lastVote.caption.id, flippedValue);

    setLastVote(null);
  }, [lastVote]);

  // Pointer event handlers for swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startXRef.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (dragX > threshold) {
      animateAndVote("right");
    } else if (dragX < -threshold) {
      animateAndVote("left");
    } else {
      setDragX(0);
    }
  };

  // Compute card transform
  const getCardStyle = () => {
    if (exitDirection) {
      const x = exitDirection === "right" ? 600 : -600;
      return {
        transform: `translateX(${x}px) rotate(${exitDirection === "right" ? 20 : -20}deg)`,
        transition: "transform 0.3s ease-out",
        opacity: 0,
      };
    }
    if (isDragging || dragX !== 0) {
      const rotation = dragX * 0.05;
      return {
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      };
    }
    return {
      transform: "translateX(0) rotate(0deg)",
      transition: "transform 0.3s ease-out",
    };
  };

  const dragOpacity = Math.min(Math.abs(dragX) / 100, 1);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <span className="text-2xl">🎉</span>
        </div>
        <p className="text-zinc-400 text-lg">
          You&apos;ve voted on all captions!
        </p>
        <p className="text-zinc-600 text-sm mt-1">Check back later for more</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card area with ? button outside */}
      <div className="relative w-full max-w-sm select-none">
        {/* ? button — outside card, top-right */}
        {current.images?.image_description && (
          <div className="absolute -top-2 -right-2 z-30 group">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-sm font-bold text-zinc-300 cursor-help hover:bg-zinc-700 hover:text-white">
              ?
            </div>
            <div className="absolute top-full right-0 mt-2 w-64 p-3 rounded-xl bg-zinc-900 border border-zinc-700/50 shadow-xl shadow-black/40 text-sm text-zinc-300 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-40">
              {current.images.image_description}
            </div>
          </div>
        )}

        {/* Next card preview (behind current) */}
        {queue[1] && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-900/50 scale-95 opacity-50">
            <div className="relative aspect-[3/4] overflow-hidden">
              {queue[1].images?.url && (
                <img
                  src={queue[1].images.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          style={getCardStyle()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-900/50 cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Swipe direction overlays */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-green-500/20 rounded-2xl pointer-events-none"
            style={{ opacity: dragX > 0 ? dragOpacity : 0 }}
          >
            <span className="text-6xl">👍</span>
          </div>
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/20 rounded-2xl pointer-events-none"
            style={{ opacity: dragX < 0 ? dragOpacity : 0 }}
          >
            <span className="text-6xl">👎</span>
          </div>

          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={current.images.url}
              alt={current.images.image_description || "Caption image"}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white text-base leading-relaxed drop-shadow-lg">
              &ldquo;{current.content}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Voting buttons — doubled size */}
      <div className="flex items-center gap-6">
        {/* Downvote */}
        <button
          onClick={() => animateAndVote("left")}
          disabled={isAnimating}
          className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-zinc-700/50 flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-12 h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384"
            />
          </svg>
        </button>

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={!lastVote || isAnimating}
          className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
          title="Undo last vote"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
        </button>

        {/* Upvote */}
        <button
          onClick={() => animateAndVote("right")}
          disabled={isAnimating}
          className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-zinc-700/50 flex items-center justify-center text-green-400 hover:bg-green-500/10 hover:border-green-500/30 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-12 h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V2.75a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904"
            />
          </svg>
        </button>
      </div>

      {/* Swipe hint */}
      <p className="text-zinc-600 text-xs">
        Swipe right to upvote, left to downvote
      </p>
    </div>
  );
}
