import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import apis from "./apis";
import { version, name } from "../package.json";

const app = new OpenAPIHono();

// 注册所有的路由
app.route("/v0/", apis);

// Use the middleware to serve Swagger UI at /ui
app.get("/", swaggerUI({ url: "/doc" }));

// The OpenAPI documentation will be available at /doc
app.doc("/doc", {
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
