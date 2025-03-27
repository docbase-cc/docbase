// 管理 知识库 的 API
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { AsyncStream } from "itertools-ts";

const app = new OpenAPIHono();

const baseSchema = z
  .object({
    name: z.string(),
    id: z.string(),
    path: z.string(),
  })
  .openapi({ title: "Base" });

// Search
const addBase = createRoute({
  tags: ["base"],
  method: "put",
  path: "/base",
  summary: "add knowledge base",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(), // 知识库名称
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: baseSchema,
        },
      },
      description: "added base",
    },
  },
});

// Get
const getBase = createRoute({
  tags: ["base"],
  method: "get",
  path: "/base",
  summary: "get knowledge bases",
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(baseSchema),
        },
      },
      description: "all base",
    },
  },
});

// Del
const delBase = createRoute({
  tags: ["base"],
  method: "delete",
  path: "/base",
  summary: "del knowledge base",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(), // 知识库ID
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            deleted: z.boolean(),
          }),
        },
      },
      description: "del base status",
    },
  },
});

app.openapi(addBase, async (c) => {
  const docBase = c.get("docbase");
  const { name } = c.req.valid("json");
  const base = await docBase.addBase(name);
  return c.json(base, 200);
});

app.openapi(getBase, async (c) => {
  const docBase = c.get("docbase");
  return c.json(await AsyncStream.of(docBase.getBase()).toArray(), 200);
});

app.openapi(delBase, async (c) => {
  const docBase = c.get("docbase");
  const { id } = c.req.valid("json");
  const rep = { deleted: await docBase.delBase(id) };
  return c.json(rep, 200);
});

export default app;
