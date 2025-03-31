import { OpenAPIHono } from "@hono/zod-openapi";
import { proxy } from "./utils";
import { webdav } from "../docbase";
const app = new OpenAPIHono();

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
    proxy_url: `http://localhost:${webdav.port}`,
    authorization: () => null,
  })
);

export default app;
