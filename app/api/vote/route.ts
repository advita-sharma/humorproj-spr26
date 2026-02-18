import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caption_id, vote_value } = await request.json();

  if (!caption_id || (vote_value !== 1 && vote_value !== -1)) {
    return NextResponse.json(
      { error: "caption_id and vote_value (1 or -1) are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("caption_votes")
    .insert({
      profile_id: user.id,
      caption_id,
      vote_value,
      created_datetime_utc: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caption_id, vote_value } = await request.json();

  if (!caption_id || (vote_value !== 1 && vote_value !== -1)) {
    return NextResponse.json(
      { error: "caption_id and vote_value (1 or -1) are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("caption_votes")
    .update({
      vote_value,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("profile_id", user.id)
    .eq("caption_id", caption_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
