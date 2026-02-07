// src/app/api/reference/provinces/route.ts

import { NextResponse } from "next/server";
import { fbrClient } from "@/lib/fbrClient";

export async function GET() {
  try {
    const response = await fbrClient.get("/getprovinces");

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch provinces",
        error: error?.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
