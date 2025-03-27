// 区分每个知识库

import { OpenAPIHono } from "@hono/zod-openapi";
import { proxy } from "./utils";

const app = new OpenAPIHono();

const dufsPort = 15000;

// 代理 webdav
// app.use(
//   "*",
//   basicAuth({
//     username: "docbase",
//     password: env.MEILI_MASTER_KEY,
//   })
// );

// 代理 webdav
app.use(
  "*",
  proxy({
    proxy_url: `http://localhost:${dufsPort}`,
    authorization: () => null,
  })
);

export default app;
