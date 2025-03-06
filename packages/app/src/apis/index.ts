import { OpenAPIHono } from "@hono/zod-openapi";
import { route } from "./routes";

const app = new OpenAPIHono();

// 搜索
app.openapi(route, async (c) => {
  const { q } = c.req.valid("json");
  const docBase = c.get("docbase");
  const results = await docBase.search(q);
  return c.json(results);
});

export default app;
