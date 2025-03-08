import { copy, readFile, writeFile, remove, exists } from "fs-extra";
import { version } from "package.json";

// 删除已存在的 dist 文件夹
if (await exists("dist/main")) {
  await remove("dist/main");
}

// 复制 docbase 后端构建
await copy("packages/app/dist", "dist/main");

// 复制 docbase 前端构建
await copy("packages/ui/dist", "dist/main/public");

// 复制 docker-compose 文件，并修改 tag 为最新
const content = await readFile("docker/docker-compose.yaml", "utf-8");
const newContent = content.replace(/docbase:latest/g, `docbase:${version}`);
await writeFile("dist/docker-compose.yaml", newContent);
