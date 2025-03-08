import { OpenAPIHono } from "@hono/zod-openapi";
import search from "./search";
import difySearch from "./difySearch";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "process";

const app = new OpenAPIHono();

// 允许跨域
app.use(`*`, cors());
// 使用 bearer 验证
app.use(`*`, bearerAuth({ token: env.MEILI_MASTER_KEY }));
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

// 搜索
app.openapi(search, async (c) => {
  const { q } = c.req.valid("json");
  const docBase = c.get("docbase");
  const results = await docBase.search(q);
  return c.json(results);
});

// dify 外部知识库搜索
app.openapi(difySearch, async (c) => {
  const body = c.req.valid("json");
  const docBase = c.get("docbase");
  const results = await docBase.difySearch(body as any);
  return c.json({ records: results });
});

export default app;
