import { Spinner } from "@topcli/spinner";
import { ensureDir, exists, readFile, writeFile } from "fs-extra";
import { sha1 } from "hash-wasm";
import path, { dirname } from "path";
import { URL } from "url";

export async function getFileList(
  repo: string,
  toPath: string
): Promise<string[]> {
  const base = `https://ungh.cc/repos/${repo}/files/main/`;

  // 发送 GET 请求到指定的 URL
  const response = await fetch(base);
  // 返回响应数据
  const { files } = await response.json();
  const remoteFiles = files.map((i: any) => ({
    ...i,
    getContent: async () => {
      const url = new URL(i.path, base);
      const response = await fetch(url);
      const { file } = await response.json();
      const { contents } = file;
      return contents;
    },
  }));

  // 创建一个数组来存储所有的写入文件的 Promise
  const writeFilePromises = [];
  for (const remoteFile of remoteFiles) {
    const filePath = path.join(toPath, remoteFile.path);
    // 将每个写入文件的操作封装成一个 Promise 并添加到数组中
    const writePromise = (async () => {
      const spinner = new Spinner();
      const msg = `  ${remoteFile.path}`;
      spinner.start(msg);
      if (await exists(filePath)) {
        const content = await readFile(filePath, "utf-8");
        const sha = await sha1("blob " + remoteFile.size + "\0" + content);

        if (sha.toString() === remoteFile.sha) {
          spinner.succeed(msg + " (skip)");
          return;
        }
      }
      const content = await remoteFile.getContent();
      await ensureDir(dirname(filePath));
      await writeFile(filePath, content);
      spinner.succeed(msg);
    })();
    writeFilePromises.push(writePromise);
  }
  // 使用 Promise.all 并行执行所有的写入文件操作
  await Promise.all(writeFilePromises);
  return remoteFiles.map((i: { path: string }) => i.path);
}
