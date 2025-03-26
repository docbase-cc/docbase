import { z } from "@hono/zod-openapi";

export const DifyKnowledgeRequestSchema = z
  .object({
    knowledge_id: z.string(),
    query: z.string(),
    retrieval_setting: z.object({
      top_k: z.number().int(),
      score_threshold: z.number().min(0).max(1),
    }),
    // 尚未支持 https://docs.dify.ai/zh-hans/guides/knowledge-base/external-knowledge-api-documentation#qing-qiu-ti-yuan-su
    // metadata_condition: z
    //   .object({
    //     logical_operator: z.enum(["and", "or"]).default("and").optional(),
    //     conditions: z.array(
    //       z.object({
    //         name: z.array(z.string()),
    //         comparison_operator: z.enum([
    //           "contains",
    //           "not contains",
    //           "start with",
    //           "end with",
    //           "is",
    //           "is not",
    //           "empty",
    //           "not empty",
    //           "=",
    //           "≠",
    //           ">",
    //           "<",
    //           "≥",
    //           "≤",
    //           "before",
    //           "after",
    //         ]),
    //         value: z.string(),
    //       })
    //     ),
    //   })
    //   .optional(),
  })
  .openapi("DifyKnowledgeRequestSchema");

export const DifyKnowledgeResponseRecordSchema = z
  .object({
    text: z.string(),
    score: z.number().min(0).max(1),
    title: z.string(),
    metadata: z.any(),
  })
  .openapi("DifyKnowledgeResponseRecordSchema");

export type DifyKnowledgeRequest = z.infer<typeof DifyKnowledgeRequestSchema>;
export type DifyKnowledgeResponseRecord = z.infer<
  typeof DifyKnowledgeResponseRecordSchema
>;
