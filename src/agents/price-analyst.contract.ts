
import type { ProductOffer } from "./research-state";

export interface PriceAnalystResult {
  rankedOffers: ProductOffer[];
  currency: string | null;
  analysisSummary: string;
}
