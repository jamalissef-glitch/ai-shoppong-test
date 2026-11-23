
import OpenAI from "openai";

import type {
  AgentExecutionInput,
  AgentExecutionResult,
  AgentModelExecutor,
} from "./agent-runner";

export const openAIExecutor: AgentModelExecutor =
  async <T>(
    input: AgentExecutionInput
  ): Promise<AgentExecutionResult<T>> => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const model = process.env.OPENROUTER_MODEL;

      if (!apiKey) {
        throw new Error(
          "OPENROUTER_API_KEY is missing."
        );
      }

      if (!model) {
        throw new Error(
          "OPENROUTER_MODEL is missing."
        );
      }

      const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
      });

      const response =
        await client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: input.systemPrompt,
            },
            {
              role: "user",
              content: JSON.stringify(
                input.userInput
              ),
            },
          ],
          response_format: {
            type: "json_object",
          },
        });

      const output =
        response.choices[0]?.message.content;

      if (
        typeof output !== "string" ||
        output.trim().length === 0
      ) {
        throw new Error(
          "OpenRouter returned an empty response."
        );
      }

      let data: unknown;

      try {
        data = JSON.parse(output);
      } catch {
        throw new Error(
          "OpenRouter returned invalid JSON."
        );
      }

      if (
        typeof data !== "object" ||
        data === null
      ) {
        throw new Error(
          "OpenRouter response must be a JSON object or array."
        );
      }

      return {
        success: true,
        data: data as T,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Unknown agent execution error.",
      };
    }
  };
