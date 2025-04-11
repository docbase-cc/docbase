import { defineCommand } from "citty";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { downloadDufs } from "~/downloadRelease";
import { downloadMeilisearch } from "~/downloadMeili";
import AdmZip from "adm-zip";

export default defineCommand({
  meta: {
    name: "compile",
    description: "compile docbase to one file",
  },
  async run() {
    const dn = dirname(fileURLToPath(import.meta.url));
    const main = join(dn, "../main");

    // 并行下载 dufs 和 meilisearch
    await Promise.all([downloadDufs(main), downloadMeilisearch(main)]);

    // 创建 AdmZip 实例
    const zip = new AdmZip();

    // 添加文件夹到压缩包
    zip.addLocalFolder(main);

    // 写入压缩文件
    zip.writeZip("docbase.zip", function (err) {
      if (err) {
        console.error("Error writing zip file:", err);
        return;
      }
      console.log("Zip file created successfully: docbase.zip");
    });
  },
});
