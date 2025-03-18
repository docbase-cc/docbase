import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { DocBasePlugin } from "core/src";

const app = new OpenAPIHono();

// 删除插件
const addPlugin = createRoute({
  tags: ["plguin"],
  method: "put",
  path: "/",
  summary: "安装插件",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: z.object({
      name: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
    }
  },
  responses: {
    200: {
      description: "是否成功安装",
      content: {
        "application/json": {
          schema: z.object({
            installed: z.boolean(),
          })
        }
      }
    },
  },
});

// 删除插件
const delPlugin = createRoute({
  tags: ["plguin"],
  method: "delete",
  path: "/",
  summary: "删除插件",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: z.object({
      name: z.string(),
    })
  },
  responses: {
    200: {
      description: "是否成功删除",
      content: {
        "application/json": {
          schema: z.object({
            deleted: z.boolean(),
          })
        }
      }
    },
  },
});

// 查询插件
const listPlugin = createRoute({
  tags: ["plguin"],
  method: "get",
  path: "/",
  summary: "查询插件列表",
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "插件列表",
      content: {
        "application/json": {
          schema: z.object({
            docLoaders: z.array(z.object({
              /** 插件类型，固定为"DocLoader" */
              type: z.literal("DocLoader"),
              /** 支持的文件扩展名列表 */
              exts: z.array(z.string()),
              /** 插件名称 */
              name: z.string(),
              /** 插件版本 */
              version: z.string(),
              /** 插件显示名称 */
              showName: z.string().optional(),
              /** 插件作者 */
              author: z.string().optional(),
              /** 插件描述 */
              description: z.string().optional(),
              /** 插件仓库或网站地址 */
              url: z.string().optional(),
              /** 插件图标 */
              icon: z.string().optional(),
            })),
            docSplitter: z.object({
              /** 插件类型，固定为"DocLoader" */
              type: z.literal("DocSplitter"),
              /** 插件名称 */
              name: z.string(),
              /** 插件版本 */
              version: z.string(),
              /** 插件显示名称 */
              showName: z.string().optional(),
              /** 插件作者 */
              author: z.string().optional(),
              /** 插件描述 */
              description: z.string().optional(),
              /** 插件仓库或网站地址 */
              url: z.string().optional(),
              /** 插件图标 */
              icon: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

// 查询拓展插件
const listExt = createRoute({
  tags: ["plguin"],
  method: "get",
  path: "/ext",
  summary: "获取拓展-插件映射",
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "插件-拓展映射",
      content: {
        "application/json": {
          schema: z.record(z.string())
        }
      }
    },
  },
});

// 设置拓展插件
const setExt = createRoute({
  tags: ["plguin"],
  method: "patch",
  path: "/ext",
  summary: "修改拓展-插件映射",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: z.object({
      ext: z.string(),
      docLoaderName: z.string(),
    })
  },
  responses: {
    200: {
      description: "是否成功修改",
      content: {
        "application/json": {
          schema: z.object({
            modified: z.boolean(),
          })
        }
      }
    },
  },
});

// 安装插件
app.openapi(addPlugin, async (c) => {
  const docBase = c.get("docbase");
  // npm 名称
  const { name } = c.req.valid("query")
  // 插件初始化参数
  const body = c.req.valid("json")
  const pkgManager = c.get("pkgManager")
  // 安装 npm 包
  await pkgManager.add(name)
  // 导入 npm 包插件
  const plugin: DocBasePlugin<object> = await pkgManager.import(name)
  // 加载插件
  const installed = await docBase.loadPlugin({
    plugin,
    params: body
  })
  return c.json({ installed });
})

app.openapi(listPlugin, async (c) => {
  const docBase = c.get("docbase");
  return c.json({
    docLoaders: docBase.docLoaders,
    docSplitter: docBase.docSplitter,
  });
})

app.openapi(setExt, async (c) => {
  const docBase = c.get("docbase");
  const { ext, docLoaderName } = c.req.valid("query")

  return c.json({
    modified: await docBase.setDocLoader(ext, docLoaderName),
  });
})

app.openapi(listExt, async (c) => {
  const docBase = c.get("docbase");
  return c.json(Object.fromEntries(docBase.exts));
})

app.openapi(delPlugin, async (c) => {
  const docBase = c.get("docbase");
  const { name } = c.req.valid("query")
  await c.get("pkgManager").del(name)
  const deleted = await docBase.delDocLoader(name)
  return c.json({ deleted });
})

export default app
