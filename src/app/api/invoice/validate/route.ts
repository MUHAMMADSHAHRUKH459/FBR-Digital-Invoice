import { NextResponse } from "next/server";
import { fbrClient } from "@/lib/fbrClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const endpoint = "/validateinvoicedata";

    console.log("[VALIDATE] Sending to:", endpoint);
    console.log("[Seller NTN]:", body.sellerNTNCNIC);

    const response = await fbrClient.post(endpoint, body);

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    const errorData = error?.response?.data || error.message;
    console.error("[VALIDATE Error]:", errorData);
    return NextResponse.json(
      { success: false, message: "Validation failed", error: errorData },
      { status: error?.response?.status || 401 }
    );
  }
}