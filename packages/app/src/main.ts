import { createConsola } from "consola";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import apis from "./apis";
import { version, name } from "~/package.json";
import { type DocBase } from "core/src";
import { serveStatic } from "hono/bun";
import { getDB, getPkgManager, PackageManager } from "./docbase";
import { getDocBase } from "./docbase";
import webdav from "./webdav";
import { DB } from "./docbase/db";

createConsola({
  level: import.meta.env.NODE_ENV === "production" ? 2 : 5,
}).wrapAll();

// 路由版本
export const routeVersion = `v${version.split(".")[0]}`;

declare module "hono" {
  interface ContextVariableMap {
    docbase: DocBase;
    db: DB;
    pkgManager: PackageManager;
  }
}

const app = new OpenAPIHono();
const pkgManager = getPkgManager();
const db = getDB();
const docbase = await getDocBase();

// 启动 docbase 实例
app.use(async (c, next) => {
  c.set("pkgManager", pkgManager);
  c.set("db", db);
  c.set("docbase", docbase);
  await next();
});

// 注册 docbase API
app.route(`/${routeVersion}`, apis);

// 注册 webdav 服务
app.route("/dav", webdav);

// API 文档
app.get("/doc", swaggerUI({ url: "/openapi.json" }));
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    version: version,
    title: name,
  },
});

// 前端
app.use("/*", serveStatic({ root: "public" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
