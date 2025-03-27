import { z } from "@hono/zod-openapi";

const DistributionSchema = z.object({
  mean: z.number(),
  sigma: z.number(),
});

export type Distribution = z.infer<typeof DistributionSchema>;

const OpenAiEmbedderSchema = z.object({
  source: z.literal("openAi"),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  documentTemplate: z.string().optional(),
  dimensions: z.number().optional(),
  distribution: DistributionSchema.optional(),
  url: z.string().optional(),
  documentTemplateMaxBytes: z.number().optional(),
  binaryQuantized: z.boolean().optional(),
});

export type OpenAiEmbedder = z.infer<typeof OpenAiEmbedderSchema>;

const HuggingFaceEmbedderSchema = z.object({
  source: z.literal("huggingFace"),
  model: z.string().optional(),
  revision: z.string().optional(),
  documentTemplate: z.string().optional(),
  distribution: DistributionSchema.optional(),
  documentTemplateMaxBytes: z.number().optional(),
  binaryQuantized: z.boolean().optional(),
});

export type HuggingFaceEmbedder = z.infer<typeof HuggingFaceEmbedderSchema>;

const UserProvidedEmbedderSchema = z.object({
  source: z.literal("userProvided"),
  dimensions: z.number(),
  distribution: DistributionSchema.optional(),
  binaryQuantized: z.boolean().optional(),
});

export type UserProvidedEmbedder = z.infer<typeof UserProvidedEmbedderSchema>;

const RestEmbedderSchema = z.object({
  source: z.literal("rest"),
  url: z.string(),
  apiKey: z.string().optional(),
  dimensions: z.number().optional(),
  documentTemplate: z.string().optional(),
  distribution: DistributionSchema.optional(),
  request: z.record(z.any()),
  response: z.record(z.any()),
  headers: z.record(z.string()).optional(),
  documentTemplateMaxBytes: z.number().optional(),
  binaryQuantized: z.boolean().optional(),
});

export type RestEmbedder = z.infer<typeof RestEmbedderSchema>;

const OllamaEmbedderSchema = z.object({
  source: z.literal("ollama"),
  url: z.string().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  documentTemplate: z.string().optional(),
  distribution: DistributionSchema.optional(),
  dimensions: z.number().optional(),
  documentTemplateMaxBytes: z.number().optional(),
  binaryQuantized: z.boolean().optional(),
});

export type OllamaEmbedder = z.infer<typeof OllamaEmbedderSchema>;

const EmbedderSchema = z.union([
  OpenAiEmbedderSchema,
  HuggingFaceEmbedderSchema,
  UserProvidedEmbedderSchema,
  RestEmbedderSchema,
  OllamaEmbedderSchema,
  z.null(),
]);

export type Embedder = z.infer<typeof EmbedderSchema>;

export const EmbeddersSchema = z.union([z.record(EmbedderSchema), z.null()]);

export type Embedders = z.infer<typeof EmbeddersSchema>;

export const TaskStatusEnum = z.enum([
  "succeeded",
  "processing",
  "failed",
  "enqueued",
  "canceled",
]);

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
