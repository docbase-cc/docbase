import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import apis from "./apis";
import { version, name } from "~/package.json";
import docBase from "./docbase";
import { type DocBase } from "core/src";
import { serveStatic } from "hono/bun";
import webdav from "./webdav";
import { env } from "process";
import { basicAuth } from "hono/basic-auth";

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

// 前端
app.use("/*", serveStatic({ root: "public" }));

// docker-compose 环境下代理 webdav
if (env.WEBDAV_URL) {
  console.log("Proxied webdav server: http://localhost:3000/dav");
  // 代理 webdav
  app.use("/dav/*", webdav(env.WEBDAV_URL));
  // 验证 webdav
  app.use(
    "/dav/*",
    basicAuth({
      username: "docbase",
      password: env.MEILI_MASTER_KEY,
    })
  );
}

// 注册 API
app.route(`/${routeVersion}/`, apis);

// API 文档
app.get("/doc", swaggerUI({ url: "/openapi.json" }));
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    version: version,
    title: name,
  },
});

export default {
  port: 3000,
  fetch: app.fetch,
};
