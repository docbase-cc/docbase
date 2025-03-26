import { OpenAPIHono } from "@hono/zod-openapi";
import search from "./search";

const app = new OpenAPIHono();

// 搜索
app.openapi(search, async (c) => {
  const { knowledgeId } = c.req.valid("param");
  const params = c.req.valid("json");
  const docBase = c.get("docbase");
  try {
    const res = await docBase.search({ knowledgeId, ...params });
    return c.json(res, 200);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.startsWith("No such docManagerId")) {
      const errorResponse = {
        error_code: "2001" as "2001",
        error_msg: msg,
      };
      return c.json(errorResponse, 404);
    } else {
      throw error;
    }
  }
});
