import { createConsola } from "consola";
import { serveStatic } from "hono/bun";
import { getDB, getPkgManager, getDocBase } from "./docbase";
import webdav from "./webdav";
import { createDocBaseApp } from ".";
import { dirname } from "./utils";
import { join } from "path";
import { exists } from "fs-extra";
import { cwd } from "process";
import { relative } from "path";

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

// 自动检测并启动前端
const __dirname = dirname();
const prodPublicPath = join(__dirname, "public");
const prodPublicExists = await exists(prodPublicPath);
const relativePath = relative(cwd(), prodPublicPath);
prodPublicExists && app.use("/*", serveStatic({ root: relativePath }));

export { app };

export default {
  port: 3000,
  fetch: app.fetch,
};
