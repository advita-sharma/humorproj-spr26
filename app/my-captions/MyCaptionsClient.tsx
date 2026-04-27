"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VoteCard from "../components/VoteCard";
import GenerateMoreButton from "../components/GenerateMoreButton";

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

const purpleBtn = "flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white text-sm font-semibold text-center transition-all shadow-lg shadow-violet-500/25";

function DoneFooter({ imageId }: { imageId: string }) {
  return (
    <div className="flex gap-2 w-full pt-2">
      <Link href="/upload" className={purpleBtn}>
        🖼️ Use another image
      </Link>
      <GenerateMoreButton imageId={imageId} />
    </div>
  );
}

function VotingFooter({ imageId }: { imageId: string }) {
  return (
    <div className="flex gap-2 w-full pt-2">
      <Link href="/upload" className={purpleBtn}>
        🖼️ Use another image
      </Link>
      <Link href={`/upload?imageId=${imageId}&mode=own`} className={purpleBtn}>
        Write my own
      </Link>
    </div>
  );
}

export default function MyCaptionsClient({
  unvoted,
  imageId,
  isGenerating,
  captionsCount,
}: {
  unvoted: CaptionWithImage[];
  imageId: string;
  isGenerating: boolean;
  captionsCount: number;
}) {
  const router = useRouter();

  // Poll every 3s while the spinner is showing (no unvoted captions yet).
  useEffect(() => {
    if (!isGenerating) return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [isGenerating, router]);

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-zinc-300 text-lg font-medium">Generating captions…</p>
            <p className="text-zinc-600 text-sm mt-1">This takes about 15–30 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VoteCard
      key={captionsCount}
      initialCaptions={unvoted}
      totalRemaining={unvoted.length}
      disableAutoFetch
      containImage
      emptyMessage="You've voted on all captions for this image!"
      footer={<DoneFooter imageId={imageId} />}
      votingFooter={<VotingFooter imageId={imageId} />}
    />
  );
}
