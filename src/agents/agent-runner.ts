
export interface AgentExecutionInput {
  agentName: string;
  systemPrompt: string;
  userInput: unknown;
}

export interface AgentExecutionResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export type AgentModelExecutor = <T>(
  input: AgentExecutionInput
) => Promise<AgentExecutionResult<T>>;
