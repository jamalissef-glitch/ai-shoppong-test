
import { openAIExecutor } from "./openai-executor";
import { runAgent } from "./run-agent";

import type { AgentExecutionInput } from "./agent-runner";

import type {
  ShoppingRequest,
  VerifiedOffer,
} from "./research-state";

import type {
  ReportAgentResult,
} from "./report-agent.contract";

import { reportAgentPrompt } from "./report-agent.prompt";

function createFallbackReport(
  request: ShoppingRequest,
  verificationSummary: string
): string {
  return [
    "Shopping Research Report",
    "",
    `Requested product: ${request.productName}`,
    `Condition: ${request.condition}`,
    `Country: ${request.country}`,
    "",
    "Research result:",
    "No verified offers were available for this request.",
    "",
    "Recommendation:",
    "A reliable best offer cannot be selected because the available research data does not contain a verified matching offer with sufficient evidence.",
    "",
    "Verification limitations:",
    verificationSummary ||
      "No offer was available for verification.",
    "",
    "Next step:",
    "Search for the exact requested product model and obtain reliable price, seller, condition, and availability information before making a purchase.",
  ].join("\n");
}

export async function runReportAgent(
  request: ShoppingRequest,
  verifiedOffers: VerifiedOffer[],
  analysisSummary: string,
  verificationSummary: string
): Promise<ReportAgentResult> {
  // No verified offers: create a truthful report without
  // depending on the model to generate one.
  if (verifiedOffers.length === 0) {
    return {
      finalReport: createFallbackReport(
        request,
        verificationSummary
      ),
      recommendation:
        "No verified offer is available. A reliable purchase recommendation cannot be made.",
      bestOfferUrl: null,
      reportGeneratedAt: new Date().toISOString(),
    };
  }

  const input: AgentExecutionInput = {
    agentName: "Report Agent",
    systemPrompt: reportAgentPrompt,
    userInput: {
      request,
      verifiedOffers,
      analysisSummary,
      verificationSummary,

      instructions:
        "Create a clear shopping research report using only the provided data. " +
        "Do not invent prices, seller ratings, shipping costs, availability, " +
        "product specifications, or verification evidence. " +
        "Distinguish verified information from partially verified and " +
        "unverified information. " +
        "Clearly explain verification limitations and risk flags. " +
        "Do not describe an offer as fully verified unless its " +
        "verificationStatus is verified. " +
        "Recommend an offer only when the provided evidence supports it. " +
        "If the evidence is insufficient, clearly state that no reliable " +
        "best offer can be selected. " +
        "The finalReport field must be a non-empty string. " +
        "Return valid JSON matching the ReportAgentResult contract.",
    },
  };

  const result = await runAgent<ReportAgentResult>(
    openAIExecutor,
    input
  );

  const eligibleOffers = verifiedOffers.filter(
    (offer) =>
      offer.verificationStatus === "verified" &&
      Array.isArray(offer.verificationEvidence) &&
      offer.verificationEvidence.some(
        (evidence) =>
          evidence.status === "supported" &&
          evidence.sourceUrl === offer.productUrl
      )
  );

  const allowedUrls = new Set(
    eligibleOffers.map((offer) => offer.productUrl)
  );

  const bestOfferUrl =
    typeof result.bestOfferUrl === "string" &&
    allowedUrls.has(result.bestOfferUrl)
      ? result.bestOfferUrl
      : null;

  const finalReport =
    typeof result.finalReport === "string" &&
    result.finalReport.trim().length > 0
      ? result.finalReport
      : createFallbackReport(
          request,
          verificationSummary
        );

  return {
    finalReport,
    recommendation:
      typeof result.recommendation === "string" &&
      result.recommendation.trim().length > 0
        ? result.recommendation
        : "No reliable recommendation could be generated from the available evidence.",
    bestOfferUrl,
    reportGeneratedAt: new Date().toISOString(),
  };
}
