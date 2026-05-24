import { NextResponse } from "next/server";
import { getTopazDownload, getTopazStatus } from "@/lib/server/topaz";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ processId: string }> }) {
  const { processId } = await context.params;
  const status = await getTopazStatus(processId);
  const normalized = status.status.toLowerCase();
  const download = normalized === "completed" ? await getTopazDownload(processId) : null;

  return NextResponse.json({
    ...status,
    download
  });
}
