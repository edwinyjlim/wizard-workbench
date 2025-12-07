import { query } from "@anthropic-ai/claude-agent-sdk";
import { fetchPR, postPRComment } from "./github.js";
import { buildFullPrompt } from "./prompt-builder.js";

export interface EvaluateOptions {
  prNumber: number;
  dryRun?: boolean;
  outputFile?: string;
  savePromptFile?: string;
}

export interface EvaluateResult {
  reviewComment: string;
  commentUrl?: string;
}

export async function evaluatePR(options: EvaluateOptions): Promise<EvaluateResult> {
  const { prNumber, dryRun = false, outputFile, savePromptFile } = options;

  console.log(`Fetching PR #${prNumber}...`);
  const prData = await fetchPR(prNumber);
  console.log(`PR: "${prData.title}" by @${prData.author}`);
  console.log(`Files changed: ${prData.files.length}`);

  const prompt = buildFullPrompt(prData);

  // Save prompt if requested
  if (savePromptFile) {
    const fs = await import("fs/promises");
    await fs.writeFile(savePromptFile, prompt, "utf-8");
    console.log(`\nPrompt saved to: ${savePromptFile}`);
  }

  console.log("\nRunning evaluation agent...");

  let resultText = "";

  for await (const message of query({
    prompt,
    options: {
      model: "claude-opus-4-5-20251101",
      maxTurns: 30,
      allowedTools: ["Read", "Grep", "Glob", "Bash"],
      cwd: process.cwd(),
      permissionMode: "bypassPermissions",
    },
  })) {
    if (message.type === "assistant") {
      const textContent = message.message.content.find(
        (c: { type: string }): c is { type: "text"; text: string } => c.type === "text"
      );
      if (textContent) {
        // Log full text if it looks like an error, otherwise preview
        if (textContent.text.includes("API Error")) {
          console.log("Agent:", textContent.text);
        } else {
          const preview = textContent.text.substring(0, 100);
          console.log("Agent:", preview + (textContent.text.length > 100 ? "..." : ""));
        }
      }
    }

    if (message.type === "result") {
      if (message.subtype === "success") {
        resultText = message.result;
        console.log("\nAgent completed evaluation");
      } else {
        throw new Error(`Evaluation failed: ${message.subtype}`);
      }
    }
  }

  if (!resultText) {
    throw new Error("No result received from agent");
  }

  // The agent outputs markdown directly - use it as the review comment
  const reviewComment = resultText.trim();

  if (outputFile) {
    const fs = await import("fs/promises");
    await fs.writeFile(outputFile, reviewComment, "utf-8");
    console.log(`\nEvaluation saved to: ${outputFile}`);
  }

  let commentUrl: string | undefined;
  if (!dryRun) {
    console.log("\nPosting review comment to GitHub...");
    commentUrl = await postPRComment(prNumber, reviewComment);
    console.log(`Comment posted: ${commentUrl}`);
  } else {
    console.log("\n--- DRY RUN: Review Comment Preview ---");
    console.log(reviewComment);
    console.log("--- END PREVIEW ---\n");
  }

  return { reviewComment, commentUrl };
}
