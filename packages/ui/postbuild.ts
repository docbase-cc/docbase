import { copy, exists, rmdir } from "fs-extra";

const distPath = "../../dist/main/public";

await exists(distPath).then(async (exists) => {
  if (exists) {
    await rmdir(distPath, { recursive: true });
  }
});
await copy(".output/public", distPath, { overwrite: true });
