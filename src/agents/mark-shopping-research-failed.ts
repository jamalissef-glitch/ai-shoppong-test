
import { connectDB } from "@/src/lib/mongodb";
import ShoppingResearch from "@/src/models/ShoppingResearch";

export async function markShoppingResearchFailed(
  researchId: string,
  errorMessage: string
) {
  await connectDB();

  const research = await ShoppingResearch.findById(researchId);

  if (!research) {
    console.error(
      `Shopping research not found: ${researchId}`
    );
    return;
  }

  const currentStatuses =
    typeof research.agentStatus?.toObject === "function"
      ? research.agentStatus.toObject()
      : { ...research.agentStatus };

  for (const [agentName, status] of Object.entries(
    currentStatuses
  )) {
    if (status === "processing") {
      currentStatuses[agentName] = "failed";
    }
  }

  research.agentStatus = currentStatuses;

  research.errors = [
    ...(research.errors || []),
    `Workflow failed: ${errorMessage}`,
  ];

  research.completed = true;

  await research.save();
}
