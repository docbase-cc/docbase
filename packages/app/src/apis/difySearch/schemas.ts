import { z } from "@hono/zod-openapi";

export const DifyKnowledgeRequestSchema = z
  .object({
    knowledge_id: z.string(),
    query: z.string(),
    retrieval_setting: z.object({
      top_k: z.number().int(),
      score_threshold: z.number().min(0).max(1),
    }),
  })
  .openapi("DifyKnowledgeRequestSchema");

export const DifyKnowledgeResponseRecordSchema = z
  .object({
    content: z.string(),
    score: z.number().min(0).max(1),
    title: z.string(),
    metadata: z.object({ paths: z.array(z.string()) }).optional(),
  })
  .openapi("DifyKnowledgeResponseRecordSchema");

export type DifyKnowledgeRequest = z.infer<typeof DifyKnowledgeRequestSchema>;
export type DifyKnowledgeResponseRecord = z.infer<
  typeof DifyKnowledgeResponseRecordSchema
>;
