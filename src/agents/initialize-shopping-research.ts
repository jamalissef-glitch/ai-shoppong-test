
import { connectDB } from "@/src/lib/mongodb";
import ShoppingResearch from "@/src/models/ShoppingResearch";

import type {
  ShoppingResearchState,
  ShoppingRequest,
} from "./research-state";

export async function initializeShoppingResearch(
  request: ShoppingRequest
) {
  // Connect to MongoDB before creating the research record
  await connectDB();

  const initialState: ShoppingResearchState = {
    request,

    products: [],
    offers: [],
    rankedOffers: [],
    verifiedOffers: [],

    agentStatus: {
      productScout: "pending",
      priceExtractor: "pending",
      priceAnalyst: "pending",
      verificationAgent: "pending",
      reportAgent: "pending",
    },

    analysisSummary: null,
    verificationSummary: null,

    finalReport: null,
    errors: [],
    completed: false,
  };

  const research =
    await ShoppingResearch.create(initialState);

  return {
    researchId: research._id.toString(),
    state: initialState,
  };
}
