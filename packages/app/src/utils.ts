import { exists } from "fs-extra";
import { platform } from "os";
import path, { join } from "path";
import { execPath } from "process";
import { fileURLToPath } from "url";

export const dirname = () => {
  let _dirname = path.dirname(fileURLToPath(import.meta.url));
  // 如果是 bun 编译后的环境，需要使用 execPath
  console.debug(_dirname);
  if (_dirname.includes("~BUN")) {
    _dirname = path.dirname(execPath);
  }
  console.debug(_dirname);
  return _dirname;
};

export const _dirname = dirname();
export const prodPublicPath = join(_dirname, "public");
export const prodPublicExists = await exists(prodPublicPath);
export const _binDufs = join(
  _dirname,
  "bin",
  platform() === "win32" ? "dufs.exe" : "dufs"
);
export const _binDufsExists = await exists(_binDufs);
