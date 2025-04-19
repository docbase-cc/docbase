import { spawnSync } from "child_process";
import { ensureDir } from "fs-extra";
import { readFile, writeFile } from "fs-extra";
import { version } from "package.json";

await ensureDir("./dist");

spawnSync("bun", ["run", "--filter", "*", "build"], {
  stdio: "inherit",
});

// 复制 docker-compose 文件，并修改 tag 为最新
const content = await readFile("docker/docker-compose.yaml", "utf-8");
const newContent = content.replace(/docbase:latest/g, `docbase:${version}`);
await writeFile("dist/docker-compose.yaml", newContent);
