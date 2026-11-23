
import { supervisorRouter } from "./supervisor";
import type { ShoppingResearchState } from "./research-state";

const testState: ShoppingResearchState = {
  request: {
    productName: "iPhone 16 Pro",
    storage: "256GB",
    condition: "new",
    country: "Somalia",
  },

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

  finalReport: null,
  errors: [],
  completed: false,
};

const decision = supervisorRouter(testState);

console.log(decision);
