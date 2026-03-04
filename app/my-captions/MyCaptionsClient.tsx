"use client";

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

// Footer only shown in the empty state (all captions voted on)
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

// Footer shown while actively voting
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
}: {
  unvoted: CaptionWithImage[];
  imageId: string;
}) {
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