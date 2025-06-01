import { join } from "path";
import AdmZip from "adm-zip";
import { arch, platform } from "os";
import { ensureDir } from "fs-extra";
import { downloadDufs } from "utils";

const inputDir = "./dist/main";
const outDir = "./compile";

await downloadDufs(inputDir);

// 创建 AdmZip 实例
const zip = new AdmZip();

// 添加文件夹到压缩包
zip.addLocalFolder(
  inputDir,
  "",
  (path) => !path.startsWith("index.js") && !path.startsWith("chunk-")
);

console.log("Compiling...");

await ensureDir(outDir);

const outPath = join(outDir, `docbase-${platform()}-${arch()}.zip`);

// 写入压缩文件
zip.writeZip(outPath, function (err) {
  if (err) {
    console.error("Error writing zip file:", err);
    return;
  }
  console.log("Compiled success: " + outPath);
});
