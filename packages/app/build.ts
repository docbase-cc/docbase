import { spawnSync } from "child_process";
import { downloadDufs } from "utils";
import { copy } from "fs-extra";
import { readdir } from "fs-extra";
import { resolve } from "path";
import { join } from "path";
import { version } from "~/package.json";
import { _dirname } from "./src/utils";
import esbuild from "esbuild";
import { platform } from "os";

const deps: string[] = ["@prisma/prisma-schema-wasm"];

spawnSync("bun", ["x", "prisma", "migrate", "dev", "-n", version], {
  stdio: "inherit",
  env: {
    DATABASE_URL: `file:${join(_dirname, ".docbase/data/db.sqlite")}`,
  },
});

// 获取prisma的引擎文件
const basePath = "../../node_modules/@prisma/engines";
const files = await readdir(basePath);
const names = files
  .filter((i) => i.includes("engine"))
  .map((i) => ({ name: i, path: resolve(basePath, i) }));

// 并行构建
await Promise.all([
  Bun.build({
    entrypoints: ["./src/index.ts"],
    external: deps,
    outdir: "./dist",
    splitting: true,
    target: "bun",
    sourcemap: "external",
    minify: true,
  }),
  esbuild.build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    outfile: "./dist/main.js",
    sourcemap: "external",
    format: "esm",
    platform: "node",
    minify: true,
    target: "esnext",
    external: deps,
  }),
  await copy("./prisma", "./dist/prisma"),
  await downloadDufs("./dist"),
  import.meta.env.NODE_ENV === "production" &&
    (await Bun.spawn(["bun", "x", "--bun", "rollup", "-c"]).exited),
  await copy("client", "../../dist/client"),
  Promise.all(
    deps.map((dep) =>
      copy(`../../node_modules/${dep}/`, `./dist/node_modules/${dep}/`)
    )
  ),
  ...names.map((name) => copy(name.path, join("./dist/", name.name))),
]);

spawnSync("bun", [
  "build",
  "./docbase.ts",
  "--outfile",
  join("./dist", "docbase" + (platform() === "win32" ? ".exe" : "")),
  "--compile",
]);
await copy("dist", "../../dist/main");
