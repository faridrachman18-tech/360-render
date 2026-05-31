import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const payload = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, owner_id: user.id })
    .select("id,name,cover_path,updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Project could not be created." }, { status: 500 });
  }

  return NextResponse.json({ project: data }, { status: 201 });
}
