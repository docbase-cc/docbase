import { copy, exists, rmdir } from "fs-extra";

const distPath = "../../dist/main/public";

await exists(distPath).then((exists) => {
  if (exists) {
    rmdir(distPath, { recursive: true });
  }
});
await copy("dist", distPath);
