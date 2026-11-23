import { inngest } from "./client";
import { connectDB } from "@/src/lib/mongodb";
import Research from "@/src/models/Research";


export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [{ event: "app/hello.world" }],
  },
  async ({ event, step }) => {
    const result = await step.run("say-hello", async () => {
      return {
        message: `Hello ${event.data.name}!`,
      };
    });

    return result;
  }
);

// Research Workflow
export const researchWorkflow = inngest.createFunction(
  {
    id: "research-workflow",
    triggers: [{ event: "research/requested" }],
  },
  async ({ event, step }) => {
    // Step 1: Save research topic in MongoDB
    const prepared = await step.run("prepare-research", async () => {
      await connectDB();

      const research = await Research.create({
        topic: event.data.topic,
        status: "processing",
      });

      return {
        researchId: research._id.toString(),
        topic: research.topic,
      };
    });

    // Step 2: Collect sources
    const sources = await step.run("collect-sources", async () => {
      const collectedSources = [
        {
          title: `Introduction to ${prepared.topic}`,
          url: "https://example.com/source-1",
        },
        {
          title: `Understanding ${prepared.topic}`,
          url: "https://example.com/source-2",
        },
      ];

      await connectDB();

      await Research.findByIdAndUpdate(prepared.researchId, {
        sources: collectedSources,
      });

      return collectedSources;
    });

    // Step 3: Generate and save summary
    const summary = await step.run("generate-summary", async () => {
      const generatedSummary =
        `This is a preliminary research summary about ${prepared.topic}.`;

      await connectDB();

      await Research.findByIdAndUpdate(prepared.researchId, {
        summary: generatedSummary,
        status: "completed",
      });

      return {
        topic: prepared.topic,
        summary: generatedSummary,
        sources,
      };
    });

    return {
      researchId: prepared.researchId,
      ...summary,
    };
  }
);