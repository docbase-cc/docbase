import { OpenAPIHono } from "@hono/zod-openapi";
import search from "./search";
import base from "./base";
import embedder from "./embedder";

const app = new OpenAPIHono();

// 搜索 base
app.route("/", search);
// 管理 base
app.route("/", base);
// 管理 embedder
app.route("/", embedder);

export default app;
