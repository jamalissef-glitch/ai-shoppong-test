
import type { ShoppingResearchState } from "./research-state";

export type AgentName =
  | "productScout"
  | "priceExtractor"
  | "priceAnalyst"
  | "verificationAgent"
  | "reportAgent";

export type SupervisorDecision =
  | {
      type: "run";
      agent: AgentName;
    }
  | {
      type: "done";
    }
  | {
      type: "failed";
      reason: string;
    };

const agentOrder: AgentName[] = [
  "productScout",
  "priceExtractor",
  "priceAnalyst",
  "verificationAgent",
  "reportAgent",
];

export function supervisorRouter(
  state: ShoppingResearchState
): SupervisorDecision {
  // Stop only when an agent has genuinely failed.
  const failedAgent = agentOrder.find(
    (agent) => state.agentStatus[agent] === "failed"
  );

  if (failedAgent) {
    return {
      type: "failed",
      reason: `${failedAgent} failed.`,
    };
  }

  // Empty arrays are valid research outcomes.
  // For example, no exact product match may be found.
  // Continue to the Report Agent so it can explain
  // the limitation instead of failing the workflow.

  const nextAgent = agentOrder.find(
    (agent) => state.agentStatus[agent] !== "completed"
  );

  if (nextAgent) {
    return {
      type: "run",
      agent: nextAgent,
    };
  }

  return {
    type: "done",
  };
}
