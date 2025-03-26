import { OpenAPIHono } from "@hono/zod-openapi";
import plugin from "./plugin";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import { env } from "process";
import dify from "./dify";
import base from "./base";

const app = new OpenAPIHono();

// 允许跨域
app.use(`*`, cors());

// 使用 bearer 验证
app.use(`*`, bearerAuth({ token: env.MEILI_MASTER_KEY! }));
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

// 插件管理
app.route("/plugin", plugin);
// dify 搜索
app.route("/dify", dify);
// 知识库管理
app.route("/base", base);

export default app;
