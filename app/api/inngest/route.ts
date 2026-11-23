import { serve } from "inngest/next";
import { inngest } from "@/src/inngest/client";
import { helloWorld, researchWorkflow } from "@/src/inngest/functions";

import { shoppingResearchWorkflow } from "@/src/inngest/shopping-research-workflow";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    researchWorkflow,
    shoppingResearchWorkflow,
  ],
});
