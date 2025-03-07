import { createRoute } from "@hono/zod-openapi";
import { SearchParamSchema, SearchResultsSchema } from "./schemas";

// 搜索
export const route = createRoute({
  method: "post",
  path: "/difySearch",
  summary: "作为 dify 外部知识库搜索",
  request: {
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
      description: "搜索结果",
    },
  },
});
