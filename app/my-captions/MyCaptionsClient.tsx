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

function DoneFooter({ imageId }: { imageId: string }) {
  return (
    <div className="flex flex-col gap-2 w-full pt-2">
      <Link
        href="/upload"
        className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm font-medium text-center transition-colors"
      >
        Use another image
      </Link>
      <GenerateMoreButton imageId={imageId} />
    </div>
  );
}

function VotingFooter({ imageId }: { imageId: string }) {
  return (
    <div className="flex gap-2 w-full pt-2">
      <Link
        href="/upload"
        className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-sm font-medium text-center transition-colors"
      >
        Use another image
      </Link>
      <GenerateMoreButton imageId={imageId} />
    </div>
  );
}

export default function MyCaptionsClient({
  unvoted,
  imageId,
  isGenerating,
}: {
  unvoted: CaptionWithImage[];
  imageId: string;
  isGenerating: boolean;
}) {
  const router = useRouter();

  // Auto-poll every 3s while AI captions are still being generated
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
      key={unvoted.length}
      initialCaptions={unvoted}
      totalRemaining={unvoted.length}
      disableAutoFetch
      emptyMessage="You've voted on all captions for this image!"
      footer={<DoneFooter imageId={imageId} />}
      votingFooter={<VotingFooter imageId={imageId} />}
    />
  );
}
