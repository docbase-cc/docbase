import { createRoute, z } from "@hono/zod-openapi";
import {
  DifyKnowledgeRequestSchema,
  DifyKnowledgeResponseRecordSchema,
} from "./schemas";

// Dify external knowledge base search
export default createRoute({
  tags: ["search"],
  method: "post",
  path: "/retrieval",
  summary: "Search as an external knowledge base for Dify",
  security: [
    {
      Bearer: [],
    },
  ],
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
      description: "Search results",
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
