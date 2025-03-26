import { createRoute, z } from "@hono/zod-openapi";
import {
  DifyKnowledgeRequestSchema,
  DifyKnowledgeResponseRecordSchema,
} from "./schemas";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();

// Dify external knowledge base search
const difySearch = createRoute({
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
            error_code: z.enum(["1002", "1001"]),
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

// dify 外部知识库搜索
app.openapi(difySearch, async (c) => {
  const params = c.req.valid("json");
  const docBase = c.get("docbase");
  const results = await docBase.difySearch(params);
  return c.json({ records: results }, 200);
});

export default app;
