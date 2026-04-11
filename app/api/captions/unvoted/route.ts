import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BATCH_SIZE = 20;

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
      .eq("is_public", true)
      .order("created_datetime_utc", { ascending: false })
      .limit(500),
  ]);

  if (votedResult.error) {
    return NextResponse.json({ error: votedResult.error.message }, { status: 500 });
  }
  if (captionsResult.error) {
    return NextResponse.json({ error: captionsResult.error.message }, { status: 500 });
  }

  const votedIds = new Set(
    (votedResult.data || []).map((r) => r.caption_id)
  );

  const unvoted = (captionsResult.data || [])
    .filter((c) => {
      if (votedIds.has(c.id) || !c.content) return false;
      const t = c.content.trimStart();
      return !t.startsWith("{") && !t.startsWith("[");
    })
    .slice(0, BATCH_SIZE);

  if (unvoted.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch images in one batch
  const imageIds = [...new Set(unvoted.map((c) => c.image_id))];
  const { data: images, error: imagesError } = await supabase
    .from("images")
    .select("id, url, image_description")
    .in("id", imageIds)
    .not("url", "is", null);

  if (imagesError) {
    return NextResponse.json({ error: imagesError.message }, { status: 500 });
  }

  const imageMap = new Map(
    (images || [])
      .filter((img) => typeof img.url === "string" && img.url.startsWith("http"))
      .map((img) => [img.id, img])
  );

  const result = unvoted
    .filter((c) => imageMap.has(c.image_id))
    .map((c) => ({
      id: c.id,
      content: c.content,
      image_id: c.image_id,
      images: imageMap.get(c.image_id)!,
    }));

  return NextResponse.json(result);
}