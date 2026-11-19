import { serve } from "inngest/next";
import { inngest } from "@/src/inngest/client";
import { helloWorld, researchWorkflow } from "@/src/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, researchWorkflow],
});
