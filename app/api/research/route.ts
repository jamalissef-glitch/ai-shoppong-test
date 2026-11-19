
import { NextResponse } from "next/server";
import { inngest } from "@/src/inngest/client";
import { connectDB } from "@/src/lib/mongodb";
import Research from "@/src/models/Research";

// POST: Start a new research workflow
export async function POST(request: Request) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Research topic is required" },
        { status: 400 }
      );
    }

    const event = await inngest.send({
      name: "research/requested",
      data: {
        topic: topic.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Research job started!",
      eventId: event.ids[0],
    });
  } catch (error) {
    console.error("Research API error:", error);

    return NextResponse.json(
      { error: "Failed to start research job" },
      { status: 500 }
    );
  }
}

// GET: Fetch all saved researches
export async function GET() {
  try {
    await connectDB();

    const researches = await Research.find().sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      count: researches.length,
      researches,
    });
  } catch (error) {
    console.error("Get research error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch researches",
      },
      { status: 500 }
    );
  }
}
