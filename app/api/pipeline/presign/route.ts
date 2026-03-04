import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SUPPORTED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contentType } = await request.json();

  if (!SUPPORTED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `Unsupported content type. Must be one of: ${SUPPORTED_CONTENT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const res = await fetch(
    "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contentType }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Pipeline API error: ${text}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  // data contains: { presignedUrl, cdnUrl }
  return NextResponse.json(data);
}