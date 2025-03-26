import { OpenAPIHono } from "@hono/zod-openapi";
import search from "./search";

const app = new OpenAPIHono();

// 搜索
app.route("/", search);

export default app;
