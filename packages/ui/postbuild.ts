import { copy, rmdir } from "fs-extra";

await rmdir("../../dist/main/public", { recursive: true });
await copy("dist", "../../dist/main/public");
