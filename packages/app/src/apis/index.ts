import { OpenAPIHono } from "@hono/zod-openapi";
import plugin from "./plugin";
import { cors } from "hono/cors";
import { bearerAuth } from "hono/bearer-auth";
import { HTTPException } from "hono/http-exception";
import { env } from "process";
import dify from "./dify";
import base from "./base";

const app = new OpenAPIHono();

// 允许跨域
app.use(`*`, cors());

// 使用 bearer 验证
app.use(
  `*`,
  bearerAuth({
    token: env.MEILI_MASTER_KEY!,
    noAuthenticationHeaderMessage: {
      error_code: "1001",
      error_msg: "Authentication header is missing",
    },
    invalidAuthenticationHeaderMessage: {
      error_code: "1001",
      error_msg: "Invalid authentication header",
    },
    invalidTokenMessage: {
      error_code: "1002",
      error_msg: "Invalid token",
    },
  })
);
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

// 错误统一处理
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  } else {
    // 未找到知识库
    if (err.message.startsWith("No such docManagerId")) {
      const errorResponse = {
        error_code: "2001",
        error_msg: err.message,
      };
      return c.json(errorResponse, 404);
    }

    console.error(err);

    return c.json(
      {
        error_code: "500",
        error_msg: err.message,
      },
      500
    );
  }
});

// 插件管理
app.route("/plugin", plugin);
// dify 搜索
app.route("/dify", dify);
// 知识库管理
app.route("/base", base);

export default app;
