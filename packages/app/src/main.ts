import { createConsola } from "consola";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import apis from "./apis";
import { version, name } from "~/package.json";
import { type DocBase } from "core/src";
import { serveStatic } from "hono/bun";
import webdav from "./webdav";
import { getPkgManager } from "./plugins";
import { PackageManager } from "./plugins/pkgManager";
import { createDocBase } from "./docbase"

createConsola({
  level: import.meta.env.NODE_ENV === "production" ? 2 : 5,
}).wrapAll();

// 路由版本
export const routeVersion = `v${version.split(".")[0]}`;

declare module "hono" {
  interface ContextVariableMap {
    docbase: DocBase;
    pkgManager: PackageManager
  }
}

const app = new OpenAPIHono();

// const pluginNames = Object.keys(await pkgManager.list())
// const plugins: DocBasePlugin<object>[] = await Promise.all(pluginNames.map(plugin => pkgManager.import(plugin)))
// 获取插件配置并加载插件
const docbase = await createDocBase()

// 启动 docbase 实例
app.use(async (c, next) => {
  c.set("pkgManager", await getPkgManager());
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
