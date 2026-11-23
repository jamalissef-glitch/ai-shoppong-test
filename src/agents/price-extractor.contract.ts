
import type { ProductOffer } from "./research-state";

export interface PriceExtractorResult {
  offers: ProductOffer[];
  extractedCount: number;
}
