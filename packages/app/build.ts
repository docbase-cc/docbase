import { spawnSync } from "child_process";
import { copy } from "fs-extra";

spawnSync("bun", ["x", "prisma", "generate"], {
  stdio: "inherit",
  env: {
    DATABASE_URL: `file:.docbase/data/db.sqlite`,
  },
});

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
]);

await copy("dist", "../../dist/main");
