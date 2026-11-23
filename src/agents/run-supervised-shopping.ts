
import type { ShoppingResearchState } from "./research-state";

import { supervisorRouter } from "./supervisor";
import { saveShoppingResearch } from "./save-shopping-research";

import { runProductScout } from "./run-product-scout";
import { runPriceExtractor } from "./run-price-extractor";
import { runPriceAnalyst } from "./run-price-analyst";
import { runVerificationAgent } from "./run-verification-agent";
import { runReportAgent } from "./run-report-agent";

const MAX_AGENT_STEPS = 6;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown agent error.";
}

export async function runSupervisedShopping(
  researchId: string,
  state: ShoppingResearchState
): Promise<ShoppingResearchState> {
  let iteration = 0;

  while (iteration < MAX_AGENT_STEPS) {
    iteration++;

    const decision = supervisorRouter(state);

    if (decision.type === "done") {
      state.completed = true;

      await saveShoppingResearch(researchId, state);

      return state;
    }

    if (decision.type === "failed") {
      state.completed = false;
      state.errors.push(decision.reason);

      await saveShoppingResearch(researchId, state);

      throw new Error(decision.reason);
    }

    const agent = decision.agent;

    state.agentStatus[agent] = "processing";

    await saveShoppingResearch(researchId, state);

    try {
      switch (agent) {
        case "productScout": {
          state.products = await runProductScout(
            state.request
          );

          break;
        }

        case "priceExtractor": {
          state.offers = await runPriceExtractor(
            state.products
          );

          break;
        }

        case "priceAnalyst": {
          const result = await runPriceAnalyst(
            state.request,
            state.offers
          );

          state.rankedOffers = result.rankedOffers;
          state.analysisSummary =
            result.analysisSummary;

          break;
        }

        case "verificationAgent": {
          const result = await runVerificationAgent(
            state.rankedOffers,
            state.products
          );

          state.verifiedOffers =
            result.verifiedOffers;

          state.verificationSummary =
            result.verificationSummary;

          break;
        }

        case "reportAgent": {
          const result = await runReportAgent(
            state.request,
            state.verifiedOffers,
            state.analysisSummary ?? "",
            state.verificationSummary ?? ""
          );

          state.finalReport = result.finalReport;

          break;
        }
      }

      state.agentStatus[agent] = "completed";

      await saveShoppingResearch(researchId, state);
    } catch (error) {
      state.agentStatus[agent] = "failed";
      state.completed = false;

      const errorMessage = getErrorMessage(error);

      state.errors.push(
        `${agent}: ${errorMessage}`
      );

      // Attempt to persist the failed agent state.
      try {
        await saveShoppingResearch(
          researchId,
          state
        );
      } catch (saveError) {
        console.error(
          "Failed to save shopping research after agent error:",
          saveError
        );
      }

      throw error;
    }
  }

  const maxStepsError =
    `Supervisor exceeded the maximum number of agent steps (${MAX_AGENT_STEPS}).`;

  state.completed = false;
  state.errors.push(maxStepsError);

  await saveShoppingResearch(researchId, state);

  throw new Error(maxStepsError);
}
