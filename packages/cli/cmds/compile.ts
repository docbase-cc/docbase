import { defineCommand } from "citty";
import { fileURLToPath } from "url";
import { dirname, isAbsolute, join } from "path";
import { downloadMeilisearch, downloadDufs } from "utils";
import AdmZip from "adm-zip";
import { ensureDir } from "fs-extra";
import { spawnSync } from "child_process";
import { arch, platform } from "os";
import { cwd } from "process";

export default defineCommand({
  meta: {
    name: "compile",
    description: "compile docbase to one file",
  },
  args: {
    outputDir: {
      type: "string",
      description: "compile output dir",
      required: false,
    },
  },
  async run({ args }) {
    const dn = dirname(fileURLToPath(import.meta.url));
    const main = join(dn, "../main");
    const bin = join(main, "bin");
    await ensureDir(bin);

    console.log("Downloading...");
    // 并行下载 dufs 和 meilisearch
    await Promise.all([downloadDufs(bin), downloadMeilisearch(bin)]);

    spawnSync("bun", [
      "build",
      join(main, "main.js"),
      "--outfile",
      join(main, "docbase"),
      "--compile",
    ]);

    // 创建 AdmZip 实例
    const zip = new AdmZip();

    // 添加文件夹到压缩包
    zip.addLocalFile(
      join(main, "docbase" + (platform() === "win32" ? ".exe" : "")),
      "/"
    );
    zip.addLocalFolder(join(main, "engine.node"), "/");
    zip.addLocalFolder(join(main, "public"), "/public");
    zip.addLocalFolder(join(main, "prisma"), "/prisma");
    zip.addLocalFolder(join(main, "bin"), "/bin");

    console.log("Compiling...");

    const base =
      args.outputDir && isAbsolute(args.outputDir)
        ? args.outputDir
        : join(cwd(), args.outputDir ?? "");

    const outPath = join(base, `docbase-${platform()}-${arch()}.zip`);

    // 写入压缩文件
    zip.writeZip(outPath, function (err) {
      if (err) {
        console.error("Error writing zip file:", err);
        return;
      }
      console.log("Compiled success: " + outPath);
    });
  },
});
