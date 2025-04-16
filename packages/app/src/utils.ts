import { exists } from "fs-extra";
import { platform } from "os";
import path, { join } from "path";
import { fileURLToPath } from "url";

__filename = fileURLToPath(import.meta.url);
__dirname = path.dirname(__filename);

export const prodPublicPath = join(__dirname, "public");
export const prodPublicExists = await exists(prodPublicPath);
export const _binDufs = join(
  __dirname,
  "bin",
  platform() === "win32" ? "dufs.exe" : "dufs"
);
export const _binDufsExists = await exists(_binDufs);
export const _dirname = __dirname;
