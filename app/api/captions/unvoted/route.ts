import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run voted-IDs and captions queries in parallel
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

  if (votedResult.error) {
    return NextResponse.json({ error: votedResult.error.message }, { status: 500 });
  }

  const votedIds = new Set(
    (votedResult.data || []).map((r) => r.caption_id)
  );

  const rawCaptions = (captionsResult.data || [])
    .filter((c) => !votedIds.has(c.id))
    .slice(0, 20);
  const captionsError = captionsResult.error;

  if (captionsError) {
    return NextResponse.json({ error: captionsError.message }, { status: 500 });
  }

  if (!rawCaptions || rawCaptions.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch images in one batch — only those with a URL
  const imageIds = [...new Set(rawCaptions.map((c) => c.image_id))];
  const { data: images, error: imagesError } = await supabase
    .from("images")
    .select("id, url, image_description")
    .in("id", imageIds)
    .not("url", "is", null);

  if (imagesError) {
    return NextResponse.json({ error: imagesError.message }, { status: 500 });
  }

  const imageMap = new Map(
    (images || []).map((img) => [img.id, img])
  );

  // Only return complete pairs
  const result = rawCaptions
    .filter((c) => c.content && imageMap.has(c.image_id))
    .map((c) => ({
      id: c.id,
      content: c.content,
      image_id: c.image_id,
      images: imageMap.get(c.image_id)!,
    }))
    .slice(0, 10);

  return NextResponse.json(result);
}
