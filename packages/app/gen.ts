import { exists, mkdir, writeFile } from "fs-extra";
import { createClient } from "@hey-api/openapi-ts";
import { app } from "./src/main";
import { version, name } from "~/package.json";

// 并行化文件操作
const openapi = app.getOpenAPI31Document({
  openapi: "3.1.0",
  info: {
    version: version,
    title: name,
  },
});
const openapiPath = "client/openapi.json";

// 确保目录存在
const dir = openapiPath.split("/").slice(0, -1).join("/");

if (!(await exists(dir))) {
  await mkdir(dir, { recursive: true });
}

// 将 openapi 写入文件
const writeOpenapiPromise = writeFile(
  openapiPath,
  JSON.stringify(openapi, null, 2)
);

// 生成客户端
const createClientPromise = writeOpenapiPromise.then(() =>
  createClient({
    input: openapiPath,
    output: "client",
    plugins: ["@hey-api/client-fetch"],
  })
);

await createClientPromise;
process.exit(0);
