import { defineCommand } from "citty";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { downloadDufs } from "~/downloadRelease";
import { downloadMeilisearch } from "~/downloadMeili";
// import AdmZip from "adm-zip";
import { ensureDir } from "fs-extra";
import { spawnSync } from "child_process";
// import { platform } from "os";

export default defineCommand({
  meta: {
    name: "compile",
    description: "compile docbase to one file",
  },
  async run() {
    const dn = dirname(fileURLToPath(import.meta.url));
    const main = join(dn, "../main");
    const bin = join(main, "bin");
    await ensureDir(bin);

    // 并行下载 dufs 和 meilisearch
    await Promise.all([downloadDufs(bin), downloadMeilisearch(bin)]);

    spawnSync(
      "bun",
      [
        "build",
        // "--outfile",
        // join(main, "docbase"),
        "--compile",
        "./main.js",
        "./public/**/*",
        "./prisma/**/*",
        "./bin/**/*",
      ],
      { cwd: main }
    );

    // // 创建 AdmZip 实例
    // const zip = new AdmZip();

    // // 添加文件夹到压缩包
    // zip.addLocalFile(
    //   join(main, "docbase" + (platform() === "win32" ? ".exe" : "")),
    //   "/"
    // );

    // 写入压缩文件
    // zip.writeZip("docbase.zip", function (err) {
    //   if (err) {
    //     console.error("Error writing zip file:", err);
    //     return;
    //   }
    //   console.log("Zip file created successfully: docbase.zip");
    // });
  },
});
