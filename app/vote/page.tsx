import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VoteCard from "../components/VoteCard";

export default async function VotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [votedResult, captionsResult, countResult] = await Promise.all([
    supabase
      .from("caption_votes")
      .select("caption_id")
      .eq("profile_id", user.id),
    supabase
      .from("captions")
      .select("id, content, image_id")
      .not("content", "is", null)
      .eq("is_public", true)
      .limit(50),
    supabase
      .from("captions")
      .select("*", { count: "exact", head: true })
      .not("content", "is", null)
      .eq("is_public", true),
  ]);

  const votedIds = new Set(
    (votedResult.data || []).map((r) => r.caption_id)
  );
  const totalCaptions = countResult.count ?? 0;
  const totalRemaining = totalCaptions - votedIds.size;

  const unvotedCaptions = (captionsResult.data || [])
    .filter((c) => !votedIds.has(c.id))
    .slice(0, 20);

  if (unvotedCaptions.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <main className="max-w-lg mx-auto px-6 py-8">
          <VoteCard initialCaptions={[]} totalRemaining={0} />
        </main>
      </div>
    );
  }

  const imageIds = [...new Set(unvotedCaptions.map((c) => c.image_id))];
  const { data: images } = await supabase
    .from("images")
    .select("id, url, image_description")
    .in("id", imageIds)
    .not("url", "is", null);

  const imageMap = new Map(
    (images || []).map((img) => [img.id, img])
  );

  const captions = unvotedCaptions
    .filter((c) => c.content && imageMap.has(c.image_id))
    .map((c) => ({
      id: c.id,
      content: c.content,
      image_id: c.image_id,
      images: imageMap.get(c.image_id)!,
    }))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <main className="max-w-lg mx-auto px-6 py-8">
        <VoteCard initialCaptions={captions} totalRemaining={totalRemaining} />
      </main>
    </div>
  );
}
