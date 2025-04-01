import { copy } from "fs-extra";

// 并行构建
Promise.all([
  await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    splitting: true,
    target: "bun",
    sourcemap: "external",
    minify: true,
  }),
  (async () => {
    import.meta.env.NODE_ENV === "production" &&
      (await Bun.spawn(["bun", "x", "--bun", "rollup", "-c"]).exited);
  })(),
]);

await copy("dist", "../../dist/lib");
