import { spawn } from "child_process";
import { _binDufs, _binDufsExists } from "../utils";
import { exists, chmod } from "fs-extra";
import { downloadDufs } from "~/downloadRelease";
import { dirname } from "path";

export class WebDAV {
  #dufsPort = 15000;
  #dufsExists = true;
  #started = false;
  #dufsPath: string = _binDufs;
  #path: string;

  get port() {
    return this.#dufsPort;
  }

  get started() {
    return this.#started;
  }

  constructor(path: string) {
    this.#path = path;
    if (_binDufsExists) {
      console.info("dufs 已存在于 " + this.#dufsPath);
    } else {
      this.#dufsExists = false;
      console.warn("未找到 dufs, 无法启动 webdav");
    }
  }

  startWebDAV = () => {
    if (this.#dufsExists) {
      const dufsProcess = spawn(this.#dufsPath, [
        // 运行 dufs
        "-A",
        "--path-prefix",
        "/dav",
        "--render-try-index",
        "-p",
        this.#dufsPort.toString(),
        this.#path,
      ]);
      // 错误处理
      dufsProcess.on("error", (err) => {
        console.warn("启动 dufs 失败: ", err);
      });
      dufsProcess.stderr.on("data", (data) => {
        console.warn(`dufs 错误: ${data}`);
      });
      console.info("webdav server has up at http://localhost:15000");
      this.#started = true;
    } else {
      console.info("尝试自动安装 dufs...");
      this.#downloadWebDAV().then(() => {
        console.info("dufs 已安装");
        this.startWebDAV();
      });
    }
  };

  #downloadWebDAV = async () => {
    const dufsExists = await exists(this.#dufsPath);
    if (dufsExists) return;

    await downloadDufs(dirname(_binDufs));
    await chmod(this.#dufsPath, 777);

    this.#dufsExists = true;
  };
}
