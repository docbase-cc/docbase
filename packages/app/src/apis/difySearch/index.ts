import { createRoute, z } from "@hono/zod-openapi";
import {
  DifyKnowledgeRequestSchema,
  DifyKnowledgeResponseRecordSchema,
} from "./schemas";

// dify 外部知识库搜索
export default createRoute({
  method: "post",
  path: "/retrieval",
  summary: "作为 dify 外部知识库搜索",
  request: {
    body: {
      content: {
        "application/json": {
          schema: DifyKnowledgeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "搜索结果",
      content: {
        "application/json": {
          schema: z.object({
            records: z.array(DifyKnowledgeResponseRecordSchema),
          }),
        },
      },
    },
    403: {
      description: "AccessDeniedException",
      content: {
        "application/json": {
          schema: z.object({
            error_code: z.enum(["1002"]),
            error_msg: z.string(),
          }),
        },
      },
    },
    404: {
      description: "KnowledgeDoesNotExist",
      content: {
        "application/json": {
          schema: z.object({
            error_code: z.enum(["2001"]),
            error_msg: z.string(),
          }),
        },
      },
    },
  },
});
