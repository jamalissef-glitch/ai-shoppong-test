
import { connectDB } from "@/src/lib/mongodb";
import ShoppingResearch from "@/src/models/ShoppingResearch";

import type {
  ShoppingResearchState,
} from "./research-state";

export async function saveShoppingResearch(
  researchId: string,
  state: ShoppingResearchState
) {
  // Ensure MongoDB connection
  await connectDB();

  const updatedResearch =
    await ShoppingResearch.findByIdAndUpdate(
      researchId,
      {
        $set: {
          request: state.request,

          products: state.products,
          offers: state.offers,
          rankedOffers: state.rankedOffers,
          verifiedOffers: state.verifiedOffers,

          agentStatus: state.agentStatus,

          analysisSummary:
            state.analysisSummary ?? null,

          verificationSummary:
            state.verificationSummary ?? null,

          finalReport: state.finalReport,

          errors: state.errors,

          completed: state.completed,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedResearch) {
    throw new Error(
      `Shopping research not found: ${researchId}`
    );
  }

  return updatedResearch;
}
