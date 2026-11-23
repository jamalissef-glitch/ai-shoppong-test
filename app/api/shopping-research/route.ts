
import { NextResponse } from "next/server";

import { inngest } from "@/src/inngest/client";

import { initializeShoppingResearch } from "@/src/agents/initialize-shopping-research";

import type {
  ShoppingRequest,
} from "@/src/agents/research-state";

const VALID_CONDITIONS = [
  "new",
  "used",
  "refurbished",
] as const;

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isOptionalString(
  value: unknown
): boolean {
  return (
    value === undefined ||
    value === null ||
    typeof value === "string"
  );
}

export async function POST(request: Request) {
  let researchId: string | undefined;

  try {
    let body: unknown;

    // Parse and validate JSON body
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must contain valid JSON.",
        },
        { status: 400 }
      );
    }

    // Ensure body is a plain object
    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must be a JSON object.",
        },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    // Validate required fields
    if (!isNonEmptyString(data.productName)) {
      return NextResponse.json(
        {
          success: false,
          message: "productName is required.",
        },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(data.country)) {
      return NextResponse.json(
        {
          success: false,
          message: "country is required.",
        },
        { status: 400 }
      );
    }

    // Validate product condition
    if (
      typeof data.condition !== "string" ||
      !VALID_CONDITIONS.includes(
        data.condition as
          (typeof VALID_CONDITIONS)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "condition must be new, used, or refurbished.",
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (
      !isOptionalString(data.model) ||
      !isOptionalString(data.storage) ||
      !isOptionalString(data.currency)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "model, storage, and currency must be strings when provided.",
        },
        { status: 400 }
      );
    }

    const productName = data.productName.trim();
    const country = data.country.trim();

    const model =
      typeof data.model === "string"
        ? data.model.trim()
        : undefined;

    const storage =
      typeof data.storage === "string"
        ? data.storage.trim()
        : undefined;

    const currency =
      typeof data.currency === "string"
        ? data.currency.trim().toUpperCase()
        : undefined;

    // Validate field lengths
    if (productName.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message:
            "productName must not exceed 200 characters.",
        },
        { status: 400 }
      );
    }

    if (country.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "country must not exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    if (model && model.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "model must not exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    if (storage && storage.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message:
            "storage must not exceed 50 characters.",
        },
        { status: 400 }
      );
    }

    if (
      currency &&
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "currency must be a valid 3-letter currency code, such as USD.",
        },
        { status: 400 }
      );
    }

    const researchRequest: ShoppingRequest = {
      productName,
      model: model || undefined,
      storage: storage || undefined,
      condition:
        data.condition as ShoppingRequest["condition"],
      country,
      currency: currency || undefined,
    };

    // Create initial research record in MongoDB
    const initialized =
      await initializeShoppingResearch(
        researchRequest
      );

    researchId = initialized.researchId;

    // Trigger the Inngest workflow
    await inngest.send({
      name: "shopping/research.requested",
      data: {
        researchId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shopping research started.",
        researchId,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error(
      "Shopping research API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to start shopping research.",
        ...(researchId
          ? { researchId }
          : {}),
      },
      { status: 500 }
    );
  }
}
