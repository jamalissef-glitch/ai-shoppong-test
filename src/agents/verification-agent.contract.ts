
import type { VerifiedOffer } from "./research-state";

export interface VerificationAgentResult {
  verifiedOffers: VerifiedOffer[];

  verifiedCount: number;

  partiallyVerifiedCount: number;

  unverifiedCount: number;

  verificationSummary: string;
}
