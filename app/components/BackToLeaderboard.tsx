"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BackToLeaderboard() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-2 flex justify-end">
      <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
        ← back to leaderboard
      </Link>
    </div>
  );
}
