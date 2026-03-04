import { createClient } from "@/lib/supabase/server";
import CardGrid from "./components/CardGrid";

type Image = {
  id: string;
  url: string;
  image_description: string | null;
};

type Caption = {
  id: string;
  content: string;
  image_id: string;
  like_count: number;
};

const TOP_FUNNIEST = 67;

export default async function Home() {
  const supabase = await createClient();

  const { data: topCaptions, error: captionsError } = await supabase
    .from("captions")
    .select("id, content, image_id, like_count")
    .not("content", "is", null)
    .eq("is_public", true)
    .order("like_count", { ascending: false })
    .limit(500);

  if (captionsError) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400">Error loading data: {captionsError.message}</p>
        </div>
      </div>
    );
  }

  const captions = topCaptions || [];

  const imageIds = [...new Set(captions.map((c) => c.image_id))];
  const { data: images } = imageIds.length > 0
    ? await supabase
        .from("images")
        .select("id, url, image_description")
        .in("id", imageIds)
        .not("url", "is", null)
    : { data: [] };

  const imageMap = new Map(
    (images || []).map((img: Image) => [img.id, img])
  );

  // Multiple captions per image allowed — rank all by like_count, take top 67
  const top67 = captions
    .filter((c) => imageMap.has(c.image_id))
    .map((c) => ({
      image: imageMap.get(c.image_id)!,
      caption: c,
      likeCount: c.like_count,
      rank: 0, // will be assigned client-side after filtering broken images
    }))
    .slice(0, TOP_FUNNIEST);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {top67.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <span className="text-2xl">🤔</span>
            </div>
            <p className="text-zinc-400">No captions found</p>
          </div>
        ) : (
          <CardGrid pairs={top67} />
        )}
      </main>
    </div>
  );
}