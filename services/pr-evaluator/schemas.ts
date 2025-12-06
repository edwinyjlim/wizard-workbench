import { z } from "zod";

export const IssueSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
  file: z.string().optional(),
  suggestion: z.string(),
});

export const CodeQualityIssueSchema = z.object({
  type: z.enum(["breaking", "logic", "syntax", "import", "config", "style"]),
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
  score: z.number().min(1).max(5),
  eventsTracked: z.array(z.string()),
  errorTrackingSetup: z.boolean(),
  issues: z.array(IssueSchema),
  criteriaMet: z.array(z.string()),
});

export const CodeQualitySchema = z.object({
  score: z.number().min(1).max(5),
  breaksApp: z.boolean(),
  overwritesExistingCode: z.boolean(),
  changesAppLogic: z.boolean(),
  isMinimal: z.boolean(),
  isUnderstandable: z.boolean(),
  disruptionLevel: z.enum(["none", "low", "medium", "high"]),
  issues: z.array(CodeQualityIssueSchema),
});

export const InsightsQualitySchema = z.object({
  score: z.number().min(1).max(5),
  meaningfulEvents: z.boolean(),
  enrichedProperties: z.boolean(),
  answersProductQuestions: z.boolean(),
  issues: z.array(z.string()),
  strengths: z.array(z.string()),
});

export const FileAnalysisSchema = z.object({
  filename: z.string(),
  score: z.number().min(1).max(5),
  overview: z.string(),
});

export const PREvaluationSchema = z.object({
  summary: SummarySchema,
  fileAnalysis: z.array(FileAnalysisSchema),
  posthogIntegration: PostHogIntegrationSchema,
  codeQuality: CodeQualitySchema,
  insightsQuality: InsightsQualitySchema,
  overallScore: z.number().min(1).max(5),
  recommendation: z.enum(["approve", "request_changes", "needs_discussion"]),
  reviewComment: z.string(),
});

export type PREvaluation = z.infer<typeof PREvaluationSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type CodeQualityIssue = z.infer<typeof CodeQualityIssueSchema>;
export type InsightsQuality = z.infer<typeof InsightsQualitySchema>;
export type FileAnalysis = z.infer<typeof FileAnalysisSchema>;
