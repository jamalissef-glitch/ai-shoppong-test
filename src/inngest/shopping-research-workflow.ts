
import { inngest } from "./client";

import { connectDB } from "@/src/lib/mongodb";

import ShoppingResearch from "@/src/models/ShoppingResearch";

import { runSupervisedShopping } from "@/src/agents/run-supervised-shopping";

import { markShoppingResearchFailed } from "@/src/agents/mark-shopping-research-failed";

import type {
  ShoppingResearchState,
} from "@/src/agents/research-state";

export const shoppingResearchWorkflow = inngest.createFunction(
  {
    id: "shopping-research-workflow",
    retries: 2,

    triggers: {
      event: "shopping/research.requested",
    },

    onFailure: async ({ event, error, step }) => {
      const originalEvent = event.data.event as {
        data?: {
          researchId?: string;
        };
      };

      const researchId =
        originalEvent.data?.researchId;

      if (!researchId) {
        console.error(
          "Failure handler could not find researchId."
        );
        return;
      }

      await step.run(
        "save-final-workflow-failure",
        async () => {
          await markShoppingResearchFailed(
            researchId,
            error.message || "Unknown workflow error"
          );
        }
      );
    },
  },

  async ({ event, step }) => {
    const researchId = event.data.researchId;

    const savedState = await step.run(
      "load-shopping-research",
      async () => {
        await connectDB();

        const research =
          await ShoppingResearch.findById(
            researchId
          ).lean();

        if (!research) {
          throw new Error(
            `Shopping research not found: ${researchId}`
          );
        }

        return {
          request: research.request,
          products: research.products ?? [],
          offers: research.offers ?? [],
          rankedOffers: research.rankedOffers ?? [],
          verifiedOffers:
            research.verifiedOffers ?? [],
          agentStatus: research.agentStatus,
          finalReport:
            research.finalReport ?? null,
          analysisSummary:
            research.analysisSummary ?? null,
          verificationSummary:
            research.verificationSummary ?? null,
          errors: research.errors ?? [],
          completed: research.completed ?? false,
        };
      }
    );

    const state =
      savedState as ShoppingResearchState;

    const result = await step.run(
      "run-supervised-shopping",
      async () => {
        return runSupervisedShopping(
          researchId,
          state
        );
      }
    );

    return {
      researchId,
      completed: result.completed,
      finalReport: result.finalReport,
    };
  }
);
