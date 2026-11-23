
import type { ShoppingResearchState } from "./research-state";

import { runProductScout } from "./run-product-scout";
import { runPriceExtractor } from "./run-price-extractor";
import { runPriceAnalyst } from "./run-price-analyst";
import { runVerificationAgent } from "./run-verification-agent";
import { runReportAgent } from "./run-report-agent";

import { saveShoppingResearch } from "./save-shopping-research";

type AgentStatusKey = keyof ShoppingResearchState["agentStatus"];

export async function runShoppingPipeline(
  researchId: string,
  state: ShoppingResearchState
): Promise<ShoppingResearchState> {
  let analysisSummary = "";
  let verificationSummary = "";

  async function runStage(
    agentKey: AgentStatusKey,
    work: () => Promise<void>
  ) {
    state.agentStatus[agentKey] = "processing";
    await saveShoppingResearch(researchId, state);

    try {
      await work();

      state.agentStatus[agentKey] = "completed";
      await saveShoppingResearch(researchId, state);
    } catch (error) {
      state.agentStatus[agentKey] = "failed";

      state.errors.push(
        error instanceof Error
          ? error.message
          : "Unknown agent error."
      );

      await saveShoppingResearch(researchId, state);
      throw error;
    }
  }

  await runStage("productScout", async () => {
    state.products = await runProductScout(state.request);
  });

  await runStage("priceExtractor", async () => {
    state.offers = await runPriceExtractor(state.products);
  });

  await runStage("priceAnalyst", async () => {
    const result = await runPriceAnalyst(
      state.request,
      state.offers
    );

    state.rankedOffers = result.rankedOffers;
    analysisSummary = result.analysisSummary;
  });

  await runStage("verificationAgent", async () => {
    const result = await runVerificationAgent(
      state.rankedOffers,
      state.products
    );

    state.verifiedOffers = result.verifiedOffers;
    verificationSummary = result.verificationSummary;
  });

  await runStage("reportAgent", async () => {
    const result = await runReportAgent(
      state.request,
      state.verifiedOffers,
      analysisSummary,
      verificationSummary
    );

    state.finalReport = result.finalReport;
  });

  state.completed = true;

  await saveShoppingResearch(researchId, state);

  return state;
}
