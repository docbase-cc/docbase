import { spawn } from "child_process";
import { existsSync } from "fs-extra";

const dufsPort = 15000;

export const startWebDAV = (path: string) => {
  let dufsCmd: string | undefined = undefined;

  if (existsSync("../../dist/dufs.exe")) {
    dufsCmd = "../../dist/dufs.exe";
  }

  if (existsSync("/bin/dufs")) {
    dufsCmd = "dufs";
  }

  if (dufsCmd) {
    const dufsProcess = spawn(dufsCmd, [
      // 运行 dufs
      "-A",
      // "--path-prefix",
      // "/dav",
      "--render-try-index",
      "-p",
      dufsPort.toString(),
      path,
    ]);
    // 错误处理
    dufsProcess.on("error", (err) => {
      console.error("启动 dufs 失败:", err);
    });
    dufsProcess.stderr.on("data", (data) => {
      console.error(`dufs 错误: ${data}`);
    });
    console.info("webdav server has up at http://localhost:15000");
  }
};
