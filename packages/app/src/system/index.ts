import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { ensureContainsFilterFeatureOn } from "core";
import { MeiliSearch } from "meilisearch";
import { webdav as WebDAV } from "../docbase";

const app = new OpenAPIHono();

const getStatus = createRoute({
  tags: ["system"],
  method: "get",
  path: "/",
  summary: "get system status",
  responses: {
    200: {
      description: "system inited or not",
      content: {
        "application/json": {
          schema: z.object({
            inited: z.boolean(),
            webdav: z.boolean(),
          }),
        },
      },
    },
  },
});

const setConfig = createRoute({
  tags: ["system"],
  method: "post",
  path: "/",
  summary: "set system config",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            host: z.string(), // meiliSearch host
            apiKey: z.string(), // meiliSearch apiKey
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "system inited successfully",
      content: {
        "application/json": {
          schema: z.object({
            inited: z.literal(true),
            webdav: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "system has already inited",
      content: {
        "application/json": {
          schema: z.object({
            inited: z.boolean(),
            webdav: z.boolean(),
            msg: z.string(),
          }),
        },
      },
    },
  },
});

// 系统状态
app.openapi(getStatus, async (c) => {
  const db = c.get("db");
  const webdav = WebDAV.started;
  return c.json({ inited: await db.config.exists(), webdav }, 200);
});

// 设置系统配置
app.openapi(setConfig, async (c) => {
  const db = c.get("db");
  const inited = await db.config.exists();
  const webdav = WebDAV.started;

  if (inited) {
    return c.json({ inited, webdav, msg: "system has already inited" }, 400);
  } else {
    const config = c.req.valid("json");
    const meiliSearchConfig = {
      host: config.host,
      apiKey: config.apiKey,
    };
    const ml = new MeiliSearch(meiliSearchConfig);
    try {
      await ensureContainsFilterFeatureOn(ml);
      await db.config.set({
        meiliSearchConfig: {
          host: config.host,
          apiKey: config.apiKey,
        },
      });
      return c.json({ inited: true as true, webdav }, 200);
    } catch (error) {
      const msg = (error as Error).message;
      return c.json(
        {
          inited: false,
          webdav,
          msg: `failed to connect to meilisearch: ${msg}`,
        },
        400
      );
    }
  }
});

export default app;
