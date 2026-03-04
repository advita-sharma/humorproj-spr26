"use client";

import { useState, useEffect } from "react";
import Pagination from "./Pagination";

const ITEMS_PER_PAGE = 12;

type Pair = {
  image: { id: string; url: string; image_description: string | null };
  caption: { id: string; content: string; like_count: number };
  likeCount: number;
  rank: number;
};

export default function CardGrid({ pairs }: { pairs: Pair[] }) {
  const [selected, setSelected] = useState<Pair | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Re-number after filtering broken images, then paginate
  const ranked = pairs
    .filter((p) => !failedIds.has(p.image.id))
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const totalPages = Math.max(1, Math.ceil(ranked.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visiblePairs = ranked.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // If a removal shrinks the total pages, clamp current page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visiblePairs.map((pair) => (
          <article
            key={pair.caption.id}
            onClick={() => setSelected(pair)}
            className="group relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-1 cursor-pointer"
          >
            {/* Rank Badge */}
            <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/10">
              #{pair.rank}
            </div>

            {/* Like Count Badge */}
            <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-rose-400"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              {pair.likeCount.toLocaleString()}
            </div>

            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
              <img
                src={pair.image.url}
                alt={pair.image.image_description || "Funny image"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() =>
                  setFailedIds((prev) => new Set(prev).add(pair.image.id))
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white text-sm leading-relaxed line-clamp-3 drop-shadow-lg">
                &ldquo;{pair.caption.content}&rdquo;
              </p>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            {/* Rank + likes */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/10">
                #{selected.rank}
              </div>
              <div className="bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-rose-400">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                {selected.likeCount.toLocaleString()}
              </div>
            </div>

            {/* Full image — object-contain so nothing is cropped */}
            <div className="bg-black flex items-center justify-center overflow-hidden" style={{ maxHeight: "65vh" }}>
              <img
                src={selected.image.url}
                alt={selected.image.image_description || "Funny image"}
                className="w-full h-full object-contain"
                style={{ maxHeight: "65vh" }}
              />
            </div>

            {/* Caption */}
            <div className="p-5">
              <p className="text-white text-base leading-relaxed">
                &ldquo;{selected.caption.content}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
