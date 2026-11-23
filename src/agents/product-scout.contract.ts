
import type { ProductListing } from "./research-state";

export interface ProductScoutResult {
  products: ProductListing[];
  searchQuery: string;
  totalFound: number;
}
