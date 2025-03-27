import { createRoute, z } from "@hono/zod-openapi";
import { SearchParamSchema, SearchResultsSchema } from "./schemas";
import { OpenAPIHono } from "@hono/zod-openapi";

// Search
const search = createRoute({
  tags: ["search", "base"],
  method: "post",
  path: "/:knowledgeId/search",
  summary: "Knowledge base search",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: z.object({ knowledgeId: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: SearchParamSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SearchResultsSchema,
        },
      },
      description: "Search results",
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

const app = new OpenAPIHono();

// 搜索
app.openapi(search, async (c) => {
  const { knowledgeId } = c.req.valid("param");
  const params = c.req.valid("json");
  const docBase = c.get("docbase");
  const res = await docBase.search({ knowledgeId, ...params });
  return c.json(res, 200);
});

export default app;
