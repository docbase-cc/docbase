import { join } from "path";
import AdmZip from "adm-zip";
import { arch, platform } from "os";
import { spawnSync } from "child_process";

const main = "./dist/main";

spawnSync("bun", [
  "build",
  "./docbase.ts",
  "--outfile",
  join(main, "docbase" + (platform() === "win32" ? ".exe" : "")),
  "--compile",
]);

// 创建 AdmZip 实例
const zip = new AdmZip();

// 添加文件夹到压缩包
zip.addLocalFolder(main);

console.log("Compiling...");

const outPath = join("./compile", `docbase-${platform()}-${arch()}.zip`);

// 写入压缩文件
zip.writeZip(outPath, function (err) {
  if (err) {
    console.error("Error writing zip file:", err);
    return;
  }
  console.log("Compiled success: " + outPath);
});
