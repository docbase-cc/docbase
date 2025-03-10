import { Handler } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "process";
import { basicAuth } from "hono/basic-auth";
import { join } from "path";
import { platform } from "os";
import { existsSync } from "fs";
import { execa } from "execa";

const app = new OpenAPIHono();
const dufsPort = 15000;

interface ProxyOptions {
  proxy_url?: string;
  authorization?: (
    old: string | null
  ) => string | null | Promise<string | null>;
}

const proxy = ({ proxy_url, authorization }: ProxyOptions): Handler => {
  return async (c) => {
    // 获取原始请求的方法、URL和头部信息
    const method = c.req.method;
    const url = new URL(c.req.url);
    const headers = new Headers(c.req.header());

    // 处理授权
    const newAuth = await authorization(headers.get("authorization"));

    if (newAuth) {
      headers.set("authorization", newAuth);
    } else {
      headers.delete("authorization");
    }

    // 构建代理URL
    const targetUrl = new URL(c.req.path, proxy_url);

    // 转发请求到目标WebDAV服务器
    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body:
        method !== "GET" && method !== "HEAD" ? await c.req.blob() : undefined,
    });

    // 创建响应头
    const responseHeaders = new Headers(response.headers);

    // 返回代理响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
};

const dufs = join(
  import.meta.dir,
  platform() === "win32" ? "dufs.exe" : "dufs"
);

if (existsSync(dufs) && env.INIT_PATH) {
  // 运行 dufs
  execa(dufs, [
    "-A",
    "--path-prefix",
    "/dav",
    "-p",
    dufsPort.toString(),
    env.INIT_PATH,
  ]);

  // 代理 webdav
  app.use(
    "*",
    basicAuth({
      username: "docbase",
      password: env.MEILI_MASTER_KEY,
    })
  );
  // 代理 webdav
  app.use(
    "*",
    proxy({
      proxy_url: `http://localhost:${dufsPort}`,
      authorization: () => null,
    })
  );
  console.log("Proxied webdav server: http://localhost:3000/dav");
}

export default app;
