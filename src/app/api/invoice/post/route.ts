import { NextResponse } from "next/server";
import { fbrClient } from "@/lib/fbrClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
<<<<<<< HEAD

    // Production endpoint (no _sb suffix)
    const endpoint = "/postinvoicedata";

    console.log("[PRODUCTION POST] Sending to:", endpoint);
=======
    const endpoint = "/postinvoicedata_sb"; // _sb already baseURL ke sath handle ho jayega

    console.log("[POST] Sending to:", endpoint);
>>>>>>> 76ba5fc2a6a34b5f5032011774b0566b0986aa83
    console.log("[Seller NTN]:", body.sellerNTNCNIC);

    const response = await fbrClient.post(endpoint, body);

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    const errorData = error?.response?.data || error.message;
<<<<<<< HEAD
    console.error("[PRODUCTION POST Error]:", errorData);
=======
    console.error("[POST Error]:", errorData);
>>>>>>> 76ba5fc2a6a34b5f5032011774b0566b0986aa83
    return NextResponse.json(
      { success: false, message: "Posting failed", error: errorData },
      { status: error?.response?.status || 401 }
    );
  }
}