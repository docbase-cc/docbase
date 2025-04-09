import { copy } from "fs-extra";

// 并行构建
await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  splitting: true,
  target: "bun",
  sourcemap: "external",
  minify: true,
});

await copy("dist", "../../dist/cli");
