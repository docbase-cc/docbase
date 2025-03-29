import { exists, mkdir, writeFile, copy } from "fs-extra";
import { createClient } from "@hey-api/openapi-ts";
import apis from "./src/apis";
import { version, name } from "~/package.json";

// 并行化文件操作
const openapi = apis.getOpenAPI31Document({
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

// 并行构建
const buildPromise = Bun.build({
  entrypoints: ["./src/main.ts", "./src/index.ts"],
  outdir: "./dist",
  splitting: true,
  target: "bun",
  sourcemap: "external",
  minify: true,
});

// 等待所有异步操作完成
await Promise.all([
  createClientPromise,
  buildPromise,
  (async () => {
    await copy("./prisma", "./dist/prisma");
  })(),
  (async () => {
    await Bun.spawn(["bun", "x", "--bun", "rollup", "-c"]).exited;
  })(),
]);
