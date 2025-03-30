import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import { DocBasePlugin } from "core/src";

const app = new OpenAPIHono();

// Add a plugin
const addPlugin = createRoute({
  tags: ["plugin"],
  method: "put",
  path: "/",
  summary: "Install a plugin",
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
    },
  },
  responses: {
    200: {
      description: "Whether the plugin was successfully installed",
      content: {
        "application/json": {
          schema: z.object({
            installed: z.boolean(),
            msg: z.string().optional(),
          }),
        },
      },
    },
  },
});

// Delete a plugin
const delPlugin = createRoute({
  tags: ["plugin"],
  method: "delete",
  path: "/",
  summary: "Delete a plugin",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: z.object({
      name: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Whether the plugin was successfully deleted",
      content: {
        "application/json": {
          schema: z.object({
            deleted: z.boolean(),
            msg: z.string().optional(),
          }),
        },
      },
    },
  },
});

// List plugins
const listPlugin = createRoute({
  tags: ["plugin"],
  method: "get",
  path: "/",
  summary: "List plugins",
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "List of plugins",
      content: {
        "application/json": {
          schema: z.object({
            docLoaders: z.array(
              z.object({
                /** Plugin name */
                name: z.string(),
                /** Plugin type, fixed as "DocLoader" */
                pluginType: z.literal("DocLoader"),
                /** List of supported file extensions */
                exts: z.array(z.string()),
              })
            ),
            docSplitter: z.object({
              /** Plugin name */
              name: z.string(),
              /** Plugin type, fixed as "DocLoader" */
              pluginType: z.literal("DocSplitter"),
            }),
          }),
        },
      },
    },
  },
});

// List extension plugins
const listExt = createRoute({
  tags: ["plugin"],
  method: "get",
  path: "/ext",
  summary: "Get extension-plugin mapping",
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "Plugin-extension mapping",
      content: {
        "application/json": {
          schema: z.record(z.string()),
        },
      },
    },
  },
});

// Set extension plugins
const setExt = createRoute({
  tags: ["plugin"],
  method: "patch",
  path: "/ext",
  summary: "Modify extension-plugin mapping",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    query: z.object({
      ext: z.string(),
      docLoaderName: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Whether the mapping was successfully modified",
      content: {
        "application/json": {
          schema: z.object({
            modified: z.boolean(),
          }),
        },
      },
    },
  },
});

// Install a plugin
app.openapi(addPlugin, async (c) => {
  console.info("Starting to install plugin:", c.req.valid("query").name);
  const docBase = c.get("docbase");
  // npm name
  const { name } = c.req.valid("query");
  // Plugin initialization parameters
  const body = c.req.valid("json");
  // const db = c.get("db");
  const pkgManager = c.get("pkgManager");

  try {
    // Install the npm package
    await pkgManager.add(name);
    console.info("Successfully installed npm package:", name);
    // Import the npm package plugin
    const plugin: DocBasePlugin = await pkgManager.import(name);
    console.info("Successfully imported plugin:", name);
    if (plugin.pluginType === "DocSplitter") {
      const oldPlugin = docBase.docSplitter.name;
      // Load the plugin
      const installed = await docBase.loadPlugin({
        plugin,
        config: body,
      });
      console.info("Successfully loaded DocSplitter plugin:", name);
      // Delete the old non-default DocSplitter plugin
      if (oldPlugin !== "default") {
        await pkgManager.del(oldPlugin);
        console.info("Deleted old non-default DocSplitter plugin:", oldPlugin);
      }
      return c.json({ installed });
    } else {
      // Load the plugin
      await docBase.loadPlugin({
        plugin,
        config: body,
      });
      console.info("Successfully loaded plugin:", name);
      // Save the plugin configuration name -> body
      // Start a full re-scan immediately
      docBase.scanAllNow();
      console.info("Started full re-scan after plugin installation:", name);
      return c.json({ installed: true });
    }
  } catch (error) {
    await pkgManager.del(name);
    const err = error as Error;
    console.error("Failed to install plugin:", name, err.message);
    return c.json({ installed: false, msg: err.message });
  }
});

app.openapi(listPlugin, async (c) => {
  console.info("Listing plugins");
  const docBase = c.get("docbase");
  return c.json({
    docLoaders: docBase.docLoaders.toArray(),
    docSplitter: docBase.docSplitter,
  });
});

app.openapi(setExt, async (c) => {
  const { ext, docLoaderName } = c.req.valid("query");
  console.info(
    "Modifying extension-plugin mapping for ext:",
    ext,
    "with docLoaderName:",
    docLoaderName
  );
  const docBase = c.get("docbase");
  const result = await docBase.setDocLoader(ext, docLoaderName);
  return c.json(result);
});

app.openapi(listExt, async (c) => {
  console.info("Getting extension-plugin mapping");
  const docBase = c.get("docbase");
  return c.json(Object.fromEntries(docBase.exts));
});

app.openapi(delPlugin, async (c) => {
  const { name } = c.req.valid("query");
  console.info("Starting to delete plugin:", name);
  const docBase = c.get("docbase");
  if (name === "default") {
    console.warn("Attempted to delete default plugin:", name);
    return c.json({
      deleted: false,
      msg: "The default plugin cannot be deleted",
    });
  }

  if (docBase.docSplitter.name === name) {
    console.warn("Attempted to delete DocSplitter plugin:", name);
    return c.json({
      deleted: false,
      msg: "Cannot delete the DocSplitter plugin. Please install a new plugin to replace it",
    });
  }

  const deleted = await docBase.unLoadDocLoader(name);
  if (deleted.deleted) {
    await c.get("pkgManager").del(name);
    console.info("Successfully deleted plugin:", name);
  }
  return c.json(deleted);
});

export default app;
