// 管理知识库 embedder 的 API

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { EmbeddersSchema, TaskStatusEnum } from "./schema";

const app = new OpenAPIHono();

// getEmbedders
const getEmbedders = createRoute({
  tags: ["base"],
  method: "get",
  path: "/:knowledgeId/embedder",
  summary: "get knowledge base embedders",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: z.object({ knowledgeId: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: EmbeddersSchema,
        },
      },
      description: "Embedders",
    },
  },
});

app.openapi(getEmbedders, async (c) => {
  const docBase = c.get("docbase");
  const { knowledgeId } = c.req.valid("param");
  return c.json(await docBase.getEmbedders(knowledgeId), 200);
});

// resetEmbedders
const resetEmbedders = createRoute({
  tags: ["base"],
  method: "delete",
  path: "/:knowledgeId/embedder",
  summary: "reset knowledge base embedders",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: z.object({ knowledgeId: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ status: TaskStatusEnum }),
        },
      },
      description: "Embedders reset successfully",
    },
  },
});

app.openapi(resetEmbedders, async (c) => {
  const docBase = c.get("docbase");
  const { knowledgeId } = c.req.valid("param");
  return c.json({ status: await docBase.resetEmbedders(knowledgeId) }, 200);
});

// updateEmbedder
const updateEmbedder = createRoute({
  tags: ["base"],
  method: "post",
  path: "/:knowledgeId/embedder",
  summary: "update knowledge base embedder",
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
          schema: z.object({
            embedders: EmbeddersSchema,
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ status: TaskStatusEnum }),
        },
      },
      description: "Embedder updated successfully",
    },
  },
});

app.openapi(updateEmbedder, async (c) => {
  const docBase = c.get("docbase");
  const { knowledgeId } = c.req.valid("param");
  const { embedders } = c.req.valid("json");
  return c.json(
    { status: await docBase.updateEmbedder(knowledgeId, embedders) },
    200
  );
});

export default app;
