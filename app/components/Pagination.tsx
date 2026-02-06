"use client";

import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pageNumbers = new Set<number>();
  pageNumbers.add(1);
  pageNumbers.add(currentPage);
  if (currentPage + 1 <= totalPages) pageNumbers.add(currentPage + 1);
  pageNumbers.add(totalPages);

  const sortedPages = Array.from(pageNumbers).sort((a, b) => a - b);

  const pagesWithGaps: (number | "ellipsis")[] = [];
  for (let i = 0; i < sortedPages.length; i++) {
    if (i > 0 && sortedPages[i] - sortedPages[i - 1] > 1) {
      pagesWithGaps.push("ellipsis");
    }
    pagesWithGaps.push(sortedPages[i]);
  }

  return (
    <div className="flex justify-center items-center mt-12 mb-4">
      <nav className="flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm px-2 py-2 rounded-2xl border border-zinc-800/50">
        {/* Previous Arrow */}
        <Link
          href={`/?page=${currentPage - 1}`}
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${
            currentPage <= 1
              ? "pointer-events-none text-zinc-700"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {pagesWithGaps.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="w-10 h-10 flex items-center justify-center text-zinc-600"
              >
                ...
              </span>
            ) : (
              <Link
                key={item}
                href={`/?page=${item}`}
                className={`flex items-center justify-center w-10 h-10 rounded-xl font-medium text-sm ${
                  item === currentPage
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item}
              </Link>
            )
          )}
        </div>

        {/* Next Arrow */}
        <Link
          href={`/?page=${currentPage + 1}`}
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${
            currentPage >= totalPages
              ? "pointer-events-none text-zinc-700"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      </nav>
    </div>
  );
}
