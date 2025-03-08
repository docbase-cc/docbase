import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import apis from "./apis";
import { version, name } from "~/package.json";
import docBase from "./docbase";
import { type DocBase } from "core/src";
import { serveStatic } from "hono/bun";
import webdav from "./webdav";

// 路由版本
export const routeVersion = `v${version.split(".")[0]}`;

declare module "hono" {
  interface ContextVariableMap {
    docbase: DocBase;
  }
}

const app = new OpenAPIHono();

// 启动一个 docbase 实例
app.use(async (c, next) => {
  c.set("docbase", docBase);
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
