// 管理 知识库 的 API
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

// Search
const addBase = createRoute({
  tags: ["manage"],
  method: "put",
  path: "/:knowledgeId/base",
  summary: "add knowledge base",
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
          schema: z.object({}),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({}),
        },
      },
      description: "Search results",
    },
  },
});

// 搜索
app.openapi(addBase, async (c) => {
  const docBase = c.get("docbase");
  docBase.addBase;
  docBase.delBase;
  docBase.getBase;

  // return c.json(res, 200);
});

export default app;
