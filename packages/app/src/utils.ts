import { exists } from "fs-extra";
import { platform } from "os";
import path, { join } from "path";
import { fileURLToPath } from "url";

export const dirname = () => {
  return path.dirname(fileURLToPath(import.meta.url));
};

const __dirname = dirname();
export const prodPublicPath = join(__dirname, "public");
export const prodPublicExists = await exists(prodPublicPath);
export const _binDufs = join(
  prodPublicPath,
  "_bin",
  platform() === "win32" ? "dufs.exe" : "dufs"
);
export const _binDufsExists = await exists(_binDufs);
