import { createConsola } from "consola";
import { serveStatic } from "hono/bun";
import { getDB, getPkgManager, getDocBase } from "./docbase";
import webdav from "./webdav";
import { createDocBaseApp } from ".";

createConsola({
  level: import.meta.env.NODE_ENV === "production" ? 2 : 5,
}).wrapAll();

const app = createDocBaseApp({
  pkgManager: getPkgManager(),
  db: await getDB(),
  docbase: await getDocBase(),
});

// 注册 webdav 服务
app.route("/dav", webdav);

// 前端
app.use("/*", serveStatic({ root: "public" }));

export { app };

export default {
  port: 3000,
  fetch: app.fetch,
};
