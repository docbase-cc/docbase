import { Handler } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { env } from "process";
import { basicAuth } from "hono/basic-auth";

const app = new OpenAPIHono();

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

    // 获取请求基本路径
    // 使用字符串方法直接比较前缀，避免split和join操作
    let base = "";
    const pathLen = Math.min(c.req.path.length, c.req.routePath.length);
    for (let i = 0; i < pathLen; i++) {
      if (c.req.path[i] === c.req.routePath[i]) {
        base += c.req.path[i];
      } else {
        break;
      }
    }
    base = base.replace(/\/$/, "");

    // 构建代理URL
    const targetUrl = new URL(url.pathname.replace(base, ""), proxy_url);

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

// docker-compose 环境下代理 webdav
if (env.WEBDAV_URL) {
  try {
    // 校验 env.WEBDAV_URL 可否联通
    await fetch(env.WEBDAV_URL);
    // 验证 webdav
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
        proxy_url: env.WEBDAV_URL,
        authorization: () => null,
      })
    );
    console.log("Proxied webdav server: http://localhost:3000/dav");
  } catch (error) {
    console.error("WebDAV is not reachable.");
  }
}

export default app;
