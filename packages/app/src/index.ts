import { DocBase } from "core";
import { PackageManager, DB } from "./docbase";
import { OpenAPIHono } from "@hono/zod-openapi";
import system from "./system";
import apis from "./apis";
import { swaggerUI } from "@hono/swagger-ui";
import { version, name } from "~/package.json";
import { Context } from "hono";
import { cors } from "hono/cors";

// 路由版本
const routeVersion = `v${version.split(".")[0]}`;

declare module "hono" {
  interface ContextVariableMap {
    docbase: DocBase;
    db: DB;
    pkgManager: PackageManager;
  }
}

export interface CORSOptions {
  origin:
    | string
    | string[]
    | ((origin: string, c: Context) => string | undefined | null);
  allowMethods?: string[];
  allowHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
  exposeHeaders?: string[];
}

export const createDocBaseApp = ({
  db,
  pkgManager,
  docbase,
  corsOpts,
}: {
  db: DB;
  pkgManager: PackageManager;
  docbase: DocBase;
  corsOpts?: CORSOptions;
}) => {
  const app = new OpenAPIHono();

  // 允许跨域
  app.use(`*`, cors(corsOpts));

  // 启动 docbase 实例
  app.use(async (c, next) => {
    c.set("pkgManager", pkgManager);
    c.set("db", db);
    c.set("docbase", docbase);
    await next();
  });

  // 注册 docbase API
  app.route(`/${routeVersion}`, apis);

  // 系统相关 API
  app.route("/system", system);

  // API 文档
  app.get("/doc", swaggerUI({ url: "/openapi.json" }));
  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      version: version,
      title: name,
    },
  });

  return app;
};
