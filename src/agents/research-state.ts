
export type AgentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface ShoppingRequest {
  productName: string;
  model?: string;
  storage?: string;
  condition: "new" | "used" | "refurbished";
  country: string;
  currency?: string;
}

export interface ProductListing {
  productName: string;
  sellerName: string | null;
  productUrl: string;
  source: string;
  snippet: string;
}

export interface ProductOffer {
  productName: string;
  sellerName: string | null;
  productUrl: string;

  price: number | null;
  currency: string | null;
  shippingCost: number | null;

  condition: string | null;
  availability: string | null;
  analysisSummary: string | null;
  verificationSummary: string | null;
}

export interface VerificationEvidence {
  field:
    | "product"
    | "price"
    | "seller"
    | "condition"
    | "availability"
    | "shipping";

  status:
    | "supported"
    | "conflicting"
    | "missing";

  sourceUrl: string | null;
  evidenceText: string;
  notes: string | null;
}

export interface VerifiedOffer extends ProductOffer {
  verificationStatus:
    | "verified"
    | "partially_verified"
    | "unverified";

  evidence: string[];
  riskFlags: string[];

  verificationEvidence?: VerificationEvidence[];
}


export interface ShoppingResearchState {
  request: ShoppingRequest;

  products: ProductListing[];
  offers: ProductOffer[];
  rankedOffers: ProductOffer[];
  verifiedOffers: VerifiedOffer[];

  agentStatus: {
    productScout: AgentStatus;
    priceExtractor: AgentStatus;
    priceAnalyst: AgentStatus;
    verificationAgent: AgentStatus;
    reportAgent: AgentStatus;
  };

  analysisSummary?: string | null;
  verificationSummary?: string | null;

  finalReport: string | null;

  errors: string[];

  completed: boolean;
}
