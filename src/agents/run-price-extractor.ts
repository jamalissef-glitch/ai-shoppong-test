
import { openAIExecutor } from "./openai-executor";
import { runAgent } from "./run-agent";

import type { AgentExecutionInput } from "./agent-runner";
import type {
  ProductListing,
  ProductOffer,
} from "./research-state";

import type {
  PriceExtractorResult,
} from "./price-extractor.contract";

import { PRICE_EXTRACTOR_PROMPT } from "./price-extractor.prompt";

export async function runPriceExtractor(
  products: ProductListing[]
): Promise<ProductOffer[]> {
  if (products.length === 0) {
    return [];
  }

  const input: AgentExecutionInput = {
    agentName: "Price Extractor",
    systemPrompt: PRICE_EXTRACTOR_PROMPT,
    userInput: {
      products,
      instructions:
        "Extract price information only from the provided product listings. " +
        "Do not invent prices, currencies, shipping costs, or availability. " +
        "Use null when information is missing. " +
        "Return valid JSON matching the PriceExtractorResult contract.",
    },
  };

  const result = await runAgent<PriceExtractorResult>(
    openAIExecutor,
    input
  );

  const allowedProducts = new Map(
    products.map((product) => [
      product.productUrl,
      product,
    ])
  );

  const validOffers: ProductOffer[] = [];

  for (const offer of result.offers) {
    const originalProduct = allowedProducts.get(
      offer.productUrl
    );

    if (!originalProduct) {
      continue;
    }

    if (
      offer.price !== null &&
      (!Number.isFinite(offer.price) || offer.price < 0)
    ) {
      continue;
    }

    if (
      offer.shippingCost !== null &&
      (!Number.isFinite(offer.shippingCost) ||
        offer.shippingCost < 0)
    ) {
      continue;
    }

    validOffers.push({
      productName: originalProduct.productName,
      sellerName:
        offer.sellerName ?? originalProduct.sellerName,
      productUrl: originalProduct.productUrl,
      price: offer.price,
      currency: offer.currency,
      shippingCost: offer.shippingCost,
      condition: offer.condition,
      availability: offer.availability,

      // These summaries are maintained at research-state level.
      analysisSummary: null,
      verificationSummary: null,
    });
  }

  return validOffers;
}
