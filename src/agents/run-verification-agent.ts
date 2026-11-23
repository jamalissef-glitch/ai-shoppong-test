
import { openAIExecutor } from "./openai-executor";
import { runAgent } from "./run-agent";

import type { AgentExecutionInput } from "./agent-runner";

import type {
  ProductListing,
  ProductOffer,
  VerifiedOffer,
  VerificationEvidence,
} from "./research-state";

import type {
  VerificationAgentResult,
} from "./verification-agent.contract";

import { VERIFICATION_AGENT_PROMPT } from "./verification-agent.prompt";

export async function runVerificationAgent(
  offers: ProductOffer[],
  products: ProductListing[]
): Promise<{
  verifiedOffers: VerifiedOffer[];
  verificationSummary: string;
}> {
  if (offers.length === 0) {
    return {
      verifiedOffers: [],
      verificationSummary:
        "No offers were available for verification.",
    };
  }

  const productEvidence = new Map(
    products.map((product) => [
      product.productUrl,
      product,
    ])
  );

  const input: AgentExecutionInput = {
    agentName: "Verification Agent",
    systemPrompt: VERIFICATION_AGENT_PROMPT,
    userInput: {
      offers,
      products,
      instructions:
        "Evaluate offers using only the provided evidence. " +
        "Do not invent seller reviews, trust scores, or verification evidence. " +
        "Search snippets are not proof of a trustworthy seller. " +
        "Return valid JSON matching the VerificationAgentResult contract.",
    },
  };

  const result = await runAgent<VerificationAgentResult>(
    openAIExecutor,
    input
  );

  const allowedOffers = new Map(
    offers.map((offer) => [
      offer.productUrl,
      offer,
    ])
  );

  const verifiedOffers: VerifiedOffer[] = [];

  for (const item of result.verifiedOffers) {
    const originalOffer = allowedOffers.get(
      item.productUrl
    );

    if (!originalOffer) {
      continue;
    }

    const sourceEvidence = productEvidence.get(
      originalOffer.productUrl
    );

    const evidence: string[] = [];

    const verificationEvidence: VerificationEvidence[] = [];

    const riskFlags = [...item.riskFlags];

    if (sourceEvidence) {
      evidence.push(
        `Search result title: ${sourceEvidence.productName}`,
        `Search result source: ${sourceEvidence.source}`,
        `Search snippet: ${sourceEvidence.snippet}`
      );

      verificationEvidence.push({
        field: "product",
        status: "supported",
        sourceUrl: sourceEvidence.productUrl,
        evidenceText: sourceEvidence.productName,
        notes:
          "Product information was found in the supplied search result.",
      });

      verificationEvidence.push({
        field: "price",
        status:
          originalOffer.price !== null
            ? "supported"
            : "missing",
        sourceUrl: sourceEvidence.productUrl,
        evidenceText:
          originalOffer.price !== null
            ? `Extracted price: ${originalOffer.price} ${originalOffer.currency ?? ""}`.trim()
            : "",
        notes:
          originalOffer.price !== null
            ? "Price was extracted from the supplied offer data. It has not been independently confirmed against the live product page."
            : "No price was available in the original offer.",
      });

      verificationEvidence.push({
        field: "seller",
        status:
          originalOffer.sellerName
            ? "supported"
            : "missing",
        sourceUrl: sourceEvidence.productUrl,
        evidenceText:
          originalOffer.sellerName ?? "",
        notes:
          originalOffer.sellerName
            ? "Seller name was present in the supplied offer data. Seller reliability has not been independently established."
            : "Seller name was not available.",
      });
    } else {
      riskFlags.push(
        "No matching search evidence found."
      );

      verificationEvidence.push({
        field: "product",
        status: "missing",
        sourceUrl: originalOffer.productUrl || null,
        evidenceText: "",
        notes:
          "No matching product listing was found in the supplied search evidence.",
      });

      verificationEvidence.push({
        field: "price",
        status: "missing",
        sourceUrl: originalOffer.productUrl || null,
        evidenceText: "",
        notes:
          "The offer price could not be supported by matching search evidence.",
      });

      verificationEvidence.push({
        field: "seller",
        status: originalOffer.sellerName
          ? "supported"
          : "missing",
        sourceUrl: originalOffer.productUrl || null,
        evidenceText:
          originalOffer.sellerName ?? "",
        notes:
          "Seller information comes from the original offer and has not been independently verified.",
      });
    }

    verificationEvidence.push({
      field: "condition",
      status:
        originalOffer.condition
          ? "supported"
          : "missing",
      sourceUrl:
        sourceEvidence?.productUrl ??
        originalOffer.productUrl ??
        null,
      evidenceText:
        originalOffer.condition ?? "",
      notes:
        originalOffer.condition
          ? "Condition was present in the extracted offer. Confirm it against the seller's product page."
          : "Product condition was not available.",
    });

    verificationEvidence.push({
      field: "availability",
      status:
        originalOffer.availability
          ? "supported"
          : "missing",
      sourceUrl:
        sourceEvidence?.productUrl ??
        originalOffer.productUrl ??
        null,
      evidenceText:
        originalOffer.availability ?? "",
      notes:
        originalOffer.availability
          ? "Availability was included in the extracted offer but may require live confirmation."
          : "Availability information was not available.",
    });

    verificationEvidence.push({
      field: "shipping",
      status:
        originalOffer.shippingCost !== null
          ? "supported"
          : "missing",
      sourceUrl:
        sourceEvidence?.productUrl ??
        originalOffer.productUrl ??
        null,
      evidenceText:
        originalOffer.shippingCost !== null
          ? `Shipping cost: ${originalOffer.shippingCost} ${originalOffer.currency ?? ""}`.trim()
          : "",
      notes:
        originalOffer.shippingCost !== null
          ? "Shipping cost was included in the offer data. Confirm whether it is final and applicable to the requested country."
          : "Shipping cost was not available.",
    });

    const status =
      item.verificationStatus === "verified"
        ? "partially_verified"
        : item.verificationStatus;

    if (status === "partially_verified") {
      riskFlags.push(
        "Direct seller and product-page verification is still required."
      );
    }

    if (status === "unverified") {
      riskFlags.push(
        "Available evidence is insufficient to support this offer."
      );
    }

    verifiedOffers.push({
      ...originalOffer,

      verificationStatus: status,

      evidence,

      riskFlags: Array.from(
        new Set(riskFlags)
      ),

      verificationEvidence,
    });
  }

  return {
    verifiedOffers,

    verificationSummary:
      result.verificationSummary,
  };
}
