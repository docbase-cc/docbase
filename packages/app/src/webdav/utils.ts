import { Handler } from "hono";

interface ProxyOptions {
  proxy_url: string;
  authorization: (old: string | null) => string | null | Promise<string | null>;
}

export const proxy = ({ proxy_url, authorization }: ProxyOptions): Handler => {
  return async (c) => {
    // 获取原始请求的方法、URL和头部信息
    const method = c.req.method;
    const headers = new Headers(c.req.header());

    // 处理授权
    const newAuth = await authorization(headers.get("authorization"));

    if (newAuth) {
      headers.set("authorization", newAuth);
    } else {
      headers.delete("authorization");
    }

    if (!c.req.path.startsWith("/dav/__")) {
      // 知识库 id
      const id = c.req.param().id;
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
