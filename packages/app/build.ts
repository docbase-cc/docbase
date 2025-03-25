Bun.build({
  entrypoints: ["./src/main.ts"],
  outdir: "./dist",
  target: "bun",
  sourcemap: "external",
  minify: true,
});
