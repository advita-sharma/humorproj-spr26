import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MyCaptionsClient from "./MyCaptionsClient";
import PersistImageId from "../components/PersistImageId";

export default async function MyCaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ imageId?: string }>;
}) {
  const { imageId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!imageId) redirect("/upload");

  const [captionsResult, imageResult, votedResult] = await Promise.all([
    supabase
      .from("captions")
      .select("id, content, image_id")
      .eq("image_id", imageId)
      .not("content", "is", null),
    supabase
      .from("images")
      .select("id, url, image_description")
      .eq("id", imageId)
      .single(),
    supabase
      .from("caption_votes")
      .select("caption_id")
      .eq("profile_id", user.id),
  ]);

  const image = imageResult.data;
  if (!image?.url) redirect("/upload");

  const votedIds = new Set((votedResult.data || []).map((r) => r.caption_id));

  const captions = (captionsResult.data || [])
    .filter((c) => c.content)
    .map((c) => ({
      id: c.id,
      content: c.content,
      image_id: c.image_id,
      images: {
        id: image.id,
        url: image.url,
        image_description: image.image_description,
      },
    }));

  const unvoted = captions.filter((c) => !votedIds.has(c.id));

  return (
    <div className="min-h-screen bg-[#09090b]">
      <PersistImageId imageId={imageId} />
      <main className="max-w-lg mx-auto px-6 py-8">
        {captions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
              ⏳
            </div>
            <p className="text-zinc-400 text-lg">Captions are being generated</p>
            <p className="text-zinc-600 text-sm">Check back in a moment</p>
          </div>
        ) : (
          <MyCaptionsClient unvoted={unvoted} imageId={imageId} />
        )}
      </main>
    </div>
  );
}