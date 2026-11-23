
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/src/lib/mongodb";
import ShoppingResearch from "@/src/models/ShoppingResearch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get research ID from route params
    const { id } = await params;

    // Validate MongoDB document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid research ID.",
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find research document
    const research = await ShoppingResearch.findById(id).lean();

    // Handle missing research
    if (!research) {
      return NextResponse.json(
        {
          success: false,
          message: "Research not found.",
        },
        { status: 404 }
      );
    }

    // Return research details
    return NextResponse.json(
      {
        success: true,
        research: {
          id: research._id.toString(),

          request: research.request,

          products: research.products,
          offers: research.offers,
          rankedOffers: research.rankedOffers,
          verifiedOffers: research.verifiedOffers,

          agentStatus: research.agentStatus,

          analysisSummary:
            research.analysisSummary ?? null,

          verificationSummary:
            research.verificationSummary ?? null,

          finalReport: research.finalReport,

          errors: research.errors,

          completed: research.completed,

          createdAt: research.createdAt,
          updatedAt: research.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get shopping research error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to retrieve shopping research.",
      },
      { status: 500 }
    );
  }
}
