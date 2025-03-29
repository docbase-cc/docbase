import { DocBase } from "core/src";
import { PackageManager, DB } from "./docbase";
import { OpenAPIHono } from "@hono/zod-openapi";
import apis from "./apis";
import { swaggerUI } from "@hono/swagger-ui";
import { version, name } from "~/package.json";

// 路由版本
const routeVersion = `v${version.split(".")[0]}`;

declare module "hono" {
  interface ContextVariableMap {
    docbase: DocBase;
    db: DB;
    pkgManager: PackageManager;
  }
}

export const createDocBaseApp = ({
  db,
  pkgManager,
  docbase,
}: {
  db: DB;
  pkgManager: PackageManager;
  docbase: DocBase;
}) => {
  const app = new OpenAPIHono();

  // 启动 docbase 实例
  app.use(async (c, next) => {
    c.set("pkgManager", pkgManager);
    c.set("db", db);
    c.set("docbase", docbase);
    await next();
  });

  // 注册 docbase API
  app.route(`/${routeVersion}`, apis);

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
