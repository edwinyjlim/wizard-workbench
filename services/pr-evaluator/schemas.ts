import { z } from "zod";

export const IssueSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
  file: z.string().optional(),
  suggestion: z.string(),
});

export const CodeQualityIssueSchema = z.object({
  type: z.enum(["complexity", "naming", "structure", "style"]),
  description: z.string(),
  file: z.string().optional(),
});

export const SummarySchema = z.object({
  overview: z.string(),
  filesChanged: z.number(),
  linesAdded: z.number(),
  linesRemoved: z.number(),
});

export const PostHogIntegrationSchema = z.object({
  score: z.number(),
  eventsTracked: z.array(z.string()),
  errorTrackingSetup: z.boolean(),
  issues: z.array(IssueSchema),
  strengths: z.array(z.string()),
});

export const RunnabilitySchema = z.object({
  score: z.number(),
  canBuild: z.boolean(),
  canRun: z.boolean(),
  issues: z.array(z.string()),
  missingDependencies: z.array(z.string()),
});

export const CodeQualitySchema = z.object({
  score: z.number(),
  isMinimal: z.boolean(),
  isUnderstandable: z.boolean(),
  isMaintainable: z.boolean(),
  disruptionLevel: z.enum(["none", "low", "medium", "high"]),
  issues: z.array(CodeQualityIssueSchema),
});

export const PREvaluationSchema = z.object({
  summary: SummarySchema,
  posthogIntegration: PostHogIntegrationSchema,
  runnability: RunnabilitySchema,
  codeQuality: CodeQualitySchema,
  overallScore: z.number(),
  recommendation: z.enum(["approve", "request_changes", "needs_discussion"]),
  reviewComment: z.string(),
});

export type PREvaluation = z.infer<typeof PREvaluationSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type CodeQualityIssue = z.infer<typeof CodeQualityIssueSchema>;
