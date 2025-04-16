import { spawnSync } from "child_process";
import { copy } from "fs-extra";
import { readdir } from "fs-extra";
import { resolve } from "path";

spawnSync("bun", ["x", "prisma", "generate"], {
  stdio: "inherit",
  env: {
    DATABASE_URL: `file:.docbase/data/db.sqlite`,
  },
});

// 获取prisma的引擎文件
const basePath = "../../node_modules/.prisma/client";
const files = await readdir(basePath);
console.log(files);
const name = files.find(
  (i) => i.includes("query_engine") && i.endsWith(".node")
)!;
const enginePath = resolve(basePath, name);

// 并行构建
await Promise.all([
  Bun.build({
    entrypoints: ["./src/main.ts", "./src/index.ts"],
    // external: ["@prisma/client"],
    outdir: "./dist",
    splitting: true,
    target: "bun",
    sourcemap: "external",
    minify: true,
  }),
  (async () => {
    await copy("./prisma", "./dist/prisma");
  })(),
  (async () => {
    import.meta.env.NODE_ENV === "production" &&
      (await Bun.spawn(["bun", "x", "--bun", "rollup", "-c"]).exited);
  })(),
  (async () => {
    await copy("client", "../../dist/client");
  })(),
  (async () => {
    await copy(enginePath, "./dist/engine.node");
  })(),
]);

await copy("dist", "../../dist/main");
