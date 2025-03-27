import { copy, readFile, writeFile, remove, exists } from "fs-extra";
import { version } from "package.json";
import { downloadRelease } from "@terascope/fetch-github-release";
import { arch, platform } from "os";
import { spawnSync } from "child_process";
import { isArray } from "es-toolkit/compat";

const outputdir = "dist/main";

// 删除已存在的 dist 文件夹
if (await exists(outputdir)) {
  await remove(outputdir);
}

// 复制 docbase 后端构建
await copy("packages/app/dist", outputdir);

// 复制 docbase client
await copy("packages/app/client", "dist/client");

// 复制 docbase 前端构建
await copy("packages/ui/dist", "dist/main/public");

// 复制 docker-compose 文件，并修改 tag 为最新
const content = await readFile("docker/docker-compose.yaml", "utf-8");
const newContent = content.replace(/docbase:latest/g, `docbase:${version}`);
await writeFile("dist/docker-compose.yaml", newContent);

// 下载最新 dufs
const user = "sigoden";
const repo = "dufs";
const leaveZipped = false;
const disableLogging = false;

const a = arch()
  .replace("arm64", "aarch64")
  .replace("ia32", "i686")
  .replace("x64", "x86_64");

const p = platform().replace("win32", "windows");

const names = await downloadRelease(
  user,
  repo,
  "dist",
  (release) => release.prerelease === false,
  (asset) => asset.name.includes(p) && asset.name.includes(a),
  leaveZipped,
  disableLogging
);

const target = (isArray(names) ? names : names.assetFileNames).at(0);

if (target && (await exists(target))) {
  // 使用 tar -zxvf 文件名.tar.gz -C dist/ 并输出到命令行
  spawnSync("tar", ["-zxvf", target, "-C", "dist/"], {
    stdio: "inherit",
  });
  await remove(target);
}
