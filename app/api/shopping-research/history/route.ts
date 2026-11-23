
import { NextResponse } from "next/server";

import { connectDB } from "@/src/lib/mongodb";
import ShoppingResearch from "@/src/models/ShoppingResearch";

export async function GET() {
  try {
    await connectDB();

    const researchHistory =
      await ShoppingResearch.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select(
          "request status products offers rankedOffers verifiedOffers finalReport errors createdAt updatedAt"
        )
        .lean();

    return NextResponse.json(
      {
        success: true,
        count: researchHistory.length,
        researchHistory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Shopping research history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to retrieve shopping research history.",
      },
      { status: 500 }
    );
  }
}
