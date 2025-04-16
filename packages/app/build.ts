import { spawnSync } from "child_process";
import { copy } from "fs-extra";
import { readdir } from "fs-extra";
import { resolve } from "path";
import { join } from "path";
import { version } from "~/package.json";
import { _dirname } from "./src/utils";

const deps = ["@prisma/prisma-schema-wasm"];

spawnSync("bun", ["x", "prisma", "migrate", "dev", "-n", version], {
  stdio: "inherit",
  env: {
    DATABASE_URL: `file:${join(_dirname, ".docbase/data/db.sqlite")}`,
  },
});

// 获取prisma的引擎文件
const basePath = "../../node_modules/.prisma/client";
const files = await readdir(basePath);
const name = files.find(
  (i) => i.includes("query_engine") && i.endsWith(".node")
)!;
const enginePath = resolve(basePath, name);

// 并行构建
await Promise.all([
  Bun.build({
    entrypoints: ["./src/main.ts", "./src/index.ts"],
    external: deps,
    outdir: "./dist",
    splitting: true,
    target: "bun",
    sourcemap: "external",
    minify: true,
  }),
  await copy("./prisma", "./dist/prisma"),
  import.meta.env.NODE_ENV === "production" &&
    (await Bun.spawn(["bun", "x", "--bun", "rollup", "-c"]).exited),
  await copy("client", "../../dist/client"),
  Promise.all(
    deps.map((dep) =>
      copy(`../../node_modules/${dep}/`, `./dist/node_modules/${dep}/`)
    )
  ),
  await copy(enginePath, "./dist/query_engine.node"),
]);

await copy("dist", "../../dist/main");
