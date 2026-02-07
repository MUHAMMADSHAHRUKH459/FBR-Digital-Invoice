import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    baseUrl: config.fbr.baseUrl,
    mode: config.fbr.mode,
    tokenLoaded: !!config.fbr.token,
  });
}
