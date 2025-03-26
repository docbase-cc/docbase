import { OpenAPIHono } from "@hono/zod-openapi";
import search from "./search";
import difySearch from "./difySearch";

const app = new OpenAPIHono();

// 搜索
app.openapi(search, async (c) => {
  const { q, opts } = c.req.valid("json");
  const docBase = c.get("docbase");
  const results = await docBase.search(q, opts);
  return c.json(results);
});

// dify 外部知识库搜索
app.openapi(difySearch, async (c) => {
  const body = c.req.valid("json");
  const docBase = c.get("docbase");
  const results = await docBase.difySearch(body);
  return c.json({ records: results });
});
