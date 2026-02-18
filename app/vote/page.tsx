import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VoteCard from "../components/VoteCard";
import Link from "next/link";

export default async function VotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Run voted-IDs and all-captions queries in parallel
  const [votedResult, captionsResult] = await Promise.all([
    supabase
      .from("caption_votes")
      .select("caption_id")
      .eq("profile_id", user.id),
    supabase
      .from("captions")
      .select("id, content, image_id")
      .not("content", "is", null)
      .limit(200),
  ]);

  const votedIds = new Set(
    (votedResult.data || []).map((r) => r.caption_id)
  );

  // Filter out already-voted captions client-side
  const unvotedCaptions = (captionsResult.data || [])
    .filter((c) => !votedIds.has(c.id))
    .slice(0, 20);

  if (unvotedCaptions.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <Header />
        <main className="max-w-lg mx-auto px-6 py-8">
          <VoteCard initialCaptions={[]} />
        </main>
      </div>
    );
  }

  // Fetch images for these captions in one batch
  const imageIds = [...new Set(unvotedCaptions.map((c) => c.image_id))];
  const { data: images } = await supabase
    .from("images")
    .select("id, url, image_description")
    .in("id", imageIds)
    .not("url", "is", null);

  const imageMap = new Map(
    (images || []).map((img) => [img.id, img])
  );

  // Build complete pairs only
  const captions = unvotedCaptions
    .filter((c) => c.content && imageMap.has(c.image_id))
    .map((c) => ({
      id: c.id,
      content: c.content,
      image_id: c.image_id,
      images: imageMap.get(c.image_id)!,
    }))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Header />
      <main className="max-w-lg mx-auto px-6 py-8">
        <VoteCard initialCaptions={captions} />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#09090b]/80 border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-xl">😂</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-violet-400 transition-colors">
                Funniest 67
              </h1>
              <p className="text-xs text-zinc-500">Vote on captions</p>
            </div>
          </Link>
        </div>
        <Link
          href="/"
          className="px-4 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          Back to leaderboard
        </Link>
      </div>
    </header>
  );
}
