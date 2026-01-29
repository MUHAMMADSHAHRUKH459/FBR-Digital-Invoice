import { NextResponse } from "next/server";
import { fbrClient } from "@/lib/fbrClient";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      message: "FBR client ready",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
