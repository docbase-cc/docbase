import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import apis from "./apis";
import { version, name } from "~/package.json";
import { cors } from "hono/cors";
import docBase from "./docbase";
import { type DocBase } from "core/src";
import { serveStatic } from "hono/bun";

// 路由版本
export const routeVersion = `v${version.split(".")[0]}`;

declare module "hono" {
  interface ContextVariableMap {
    docbase: DocBase;
  }
}

const app = new OpenAPIHono();

// 挂在 docbase
app.use(async (c, next) => {
  c.set("docbase", docBase);
  await next();
});

console.log(
  import.meta.env.npm_lifecycle_event === "dev" ? "开发环境" : "生产环境"
);

// 非开发环境起前端
if (!(import.meta.env.npm_lifecycle_event === "dev"))
  app.use("/*", serveStatic({ root: "public" }));

// 注册所有的路由
app.use(`/${routeVersion}/*`, cors());
app.route(`/${routeVersion}/`, apis);

// Use the middleware to serve Swagger UI at /ui
app.get("/doc", swaggerUI({ url: "/openapi.json" }));

// The OpenAPI documentation will be available at /doc
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
