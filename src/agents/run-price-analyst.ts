
import { openAIExecutor } from "./openai-executor";
import { runAgent } from "./run-agent";

import type { AgentExecutionInput } from "./agent-runner";
import type {
  ProductOffer,
  ShoppingRequest,
} from "./research-state";

import type {
  PriceAnalystResult,
} from "./price-analyst.contract";

import { PRICE_ANALYST_PROMPT } from "./price-analyst.prompt";

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getComparableTotal(offer: ProductOffer) {
  if (offer.price === null || offer.shippingCost === null) {
    return null;
  }

  return offer.price + offer.shippingCost;
}

export async function runPriceAnalyst(
  request: ShoppingRequest,
  offers: ProductOffer[]
): Promise<{
  rankedOffers: ProductOffer[];
  analysisSummary: string;
}> {
  if (offers.length === 0) {
    return {
      rankedOffers: [],
      analysisSummary: "No offers were available for comparison.",
    };
  }

  const input: AgentExecutionInput = {
    agentName: "Price Analyst",
    systemPrompt: PRICE_ANALYST_PROMPT,
    userInput: {
      request,
      offers,
      instructions:
        "Analyze only the provided offers. " +
        "Compare matching product specifications and conditions. " +
        "Do not compare different currencies without conversion data. " +
        "Do not treat missing shipping cost as zero. " +
        "Return valid JSON matching the PriceAnalystResult contract.",
    },
  };

  const result = await runAgent<PriceAnalystResult>(
    openAIExecutor,
    input
  );

  const allowedOffers = new Map(
    offers.map((offer) => [offer.productUrl, offer])
  );

  const selectedOffers = result.rankedOffers
    .map((offer) => allowedOffers.get(offer.productUrl))
    .filter(
      (offer): offer is ProductOffer => offer !== undefined
    )
    .filter(
      (offer) =>
        normalize(offer.productName) ===
          normalize(request.productName) &&
        normalize(offer.condition) ===
          normalize(request.condition)
    );

  const uniqueOffers = Array.from(
    new Map(
      selectedOffers.map((offer) => [
        offer.productUrl,
        offer,
      ])
    ).values()
  );

  uniqueOffers.sort((a, b) => {
    if (a.currency !== b.currency) {
      return 0;
    }

    const totalA = getComparableTotal(a);
    const totalB = getComparableTotal(b);

    if (totalA === null || totalB === null) {
      return 0;
    }

    return totalA - totalB;
  });

  return {
    rankedOffers: uniqueOffers,
    analysisSummary: result.analysisSummary,
  };
}
