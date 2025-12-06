import { query } from "@anthropic-ai/claude-agent-sdk";
import { PREvaluationSchema, type PREvaluation } from "./schemas.js";
import { fetchPR, postPRComment } from "./github.js";
import { buildFullPrompt, formatReviewComment } from "./prompts.js";

export interface EvaluateOptions {
  prNumber: number;
  dryRun?: boolean;
  outputFile?: string;
  jsonFile?: string;
  savePromptFile?: string;
}

export interface EvaluateResult {
  evaluation: PREvaluation;
  commentUrl?: string;
}

function extractJSON(text: string): unknown {
  // Try to find JSON in code blocks
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try to find raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return JSON.parse(objectMatch[0]);
  }

  throw new Error("No JSON found in response");
}

export async function evaluatePR(options: EvaluateOptions): Promise<EvaluateResult> {
  const { prNumber, dryRun = false, outputFile, jsonFile, savePromptFile } = options;

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
      model: "claude-sonnet-4-20250514",
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

  // Parse the JSON from the result
  let rawEvaluation: unknown;
  try {
    rawEvaluation = extractJSON(resultText);
  } catch {
    console.error("Failed to parse JSON from result:", resultText.substring(0, 500));
    throw new Error("Failed to extract JSON from agent response");
  }

  // Validate against schema
  const parseResult = PREvaluationSchema.safeParse(rawEvaluation);
  if (!parseResult.success) {
    console.error("Schema validation errors:", parseResult.error.errors);
    console.error("Raw evaluation:", JSON.stringify(rawEvaluation, null, 2).substring(0, 1000));
    throw new Error("Evaluation result does not match expected schema");
  }

  const evaluation = parseResult.data;
  console.log(`\nOverall score: ${evaluation.overallScore}/10`);
  console.log(`Recommendation: ${evaluation.recommendation}`);

  const reviewComment = formatReviewComment(evaluation);

  if (outputFile) {
    const fs = await import("fs/promises");
    await fs.writeFile(outputFile, reviewComment, "utf-8");
    console.log(`\nEvaluation saved to: ${outputFile}`);
  }

  if (jsonFile) {
    const fs = await import("fs/promises");
    await fs.writeFile(jsonFile, JSON.stringify(evaluation, null, 2), "utf-8");
    console.log(`JSON evaluation saved to: ${jsonFile}`);
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

  return { evaluation, commentUrl };
}
