import { OpenAPIHono } from "@hono/zod-openapi";
import { proxy } from "./utils";

const app = new OpenAPIHono();

const dufsPort = 15000;

// 鉴权
// app.use(
//   ":id/*",
//   basicAuth({
//     verifyUser: async (username, password, c) => {
//       if (!c.req.path.startsWith("/dav/__")) {
//         // 知识库 id
//         const id = c.req.param().id;
//         return false;
//       } else {
//         return true;
//       }
//     },
//   })
// );

// 代理 webdav
app.use(
  ":id/*",
  proxy({
    proxy_url: `http://localhost:${dufsPort}`,
    authorization: () => null,
  })
);

export default app;
