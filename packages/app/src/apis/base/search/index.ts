import { createRoute, z } from "@hono/zod-openapi";
import { SearchParamSchema, SearchResultsSchema } from "./schemas";

// Search
export default createRoute({
  tags: ["search"],
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
