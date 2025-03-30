import { copy } from "fs-extra";

// 并行构建
await Promise.all([
  Bun.build({
    entrypoints: ["./src/main.ts", "./src/index.ts"],
    outdir: "./dist",
    splitting: true,
    target: "bun",
    sourcemap: "external",
    minify: true,
  }),
  (async () => {
    await copy("./prisma", "./dist/prisma");
  })(),
  import.meta.env.NODE_ENV === "production" &&
    (async () => {
      await Bun.spawn(["bun", "x", "--bun", "rollup", "-c"]).exited;
    })(),
]);
