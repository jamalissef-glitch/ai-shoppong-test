
import type {
  AgentExecutionInput,
  AgentExecutionResult,
  AgentModelExecutor,
} from "./agent-runner";

export async function runAgent<T>(
  executor: AgentModelExecutor,
  input: AgentExecutionInput
): Promise<T> {
  let result: AgentExecutionResult<T>;

  try {
    result = await executor<T>(input);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown executor error.";

    throw new Error(
      `${input.agentName} executor failed: ${message}`
    );
  }

  if (!result.success || result.data === null) {
    throw new Error(
      `${input.agentName} failed: ${
        result.error ?? "No data returned."
      }`
    );
  }

  const data: unknown = result.data;

  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data)
  ) {
    throw new Error(
      `${input.agentName} returned invalid output. Expected a JSON object.`
    );
  }

  return data as T;
}
