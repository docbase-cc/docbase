import { spawn } from "child_process";
import { arch } from "os";
import { dirname } from "./utils";
import { join } from "path";
import { existsSync } from "fs-extra";

const dufsPort = 15000;

export const startWebDAV = (path: string) => {
  const dufsName: string = arch() === "win32" ? "dufs.exe" : "dufs";
  const __dirname = dirname();
  const dufsPath = join(__dirname, dufsName);
  const dufsExists = existsSync(dufsPath);

  if (dufsExists) {
    const dufsProcess = spawn(dufsPath, [
      // 运行 dufs
      "-A",
      "--path-prefix",
      "/dav",
      "--render-try-index",
      "-p",
      dufsPort.toString(),
      path,
    ]);
    // 错误处理
    dufsProcess.on("error", (err) => {
      console.warn("启动 dufs 失败: ", err);
    });
    dufsProcess.stderr.on("data", (data) => {
      console.warn(`dufs 错误: ${data}`);
    });
    console.info("webdav server has up at http://localhost:15000");
  } else {
    console.warn("未找到 dufs, 未启动 webdav");
  }
};
