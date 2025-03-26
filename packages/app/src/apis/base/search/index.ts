import { createRoute } from "@hono/zod-openapi";
import { SearchParamSchema, SearchResultsSchema } from "./schemas";

// Search
export default createRoute({
  tags: ["search"],
  method: "post",
  path: "/search",
  summary: "Knowledge base search",
  security: [
    {
      Bearer: [],
    },
  ],
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
      description: "Search results",
    },
  },
});
