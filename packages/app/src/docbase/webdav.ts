import { spawn } from "child_process";
import { platform } from "os";
import { dirname } from "../utils";
import { join } from "path";
import { existsSync } from "fs-extra";
import { remove, exists, chmod } from "fs-extra";
import { downloadRelease } from "@terascope/fetch-github-release";
import { arch } from "os";
import { spawnSync } from "child_process";
import { isArray } from "es-toolkit/compat";

export class WebDAV {
  #path: string;
  #dufsPort = 15000;
  #dufsName = platform() === "win32" ? "dufs.exe" : "dufs";
  #dufsPath = join(dirname(), this.#dufsName);
  #dufsExists = true;
  #started = false;

  get port() {
    return this.#dufsPort;
  }

  get started() {
    return this.#started;
  }

  constructor(path: string) {
    this.#path = path;

    const dufsExists = existsSync(this.#dufsPath);
    const dufsExists2 = existsSync("/bin/dufs");

    if (dufsExists2) {
      this.#dufsPath = "dufs";
      console.info("dufs 已存在于 /bin/dufs");
    } else if (dufsExists) {
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
    const targetPath = dirname();
    const dufsExists = await exists(this.#dufsPath);
    if (dufsExists) return;

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
      targetPath,
      (release) => release.prerelease === false,
      (asset) => asset.name.includes(p) && asset.name.includes(a),
      leaveZipped,
      disableLogging
    );

    const target = (isArray(names) ? names : names.assetFileNames).at(0);

    if (target && (await exists(target))) {
      spawnSync("tar", ["-zxvf", target, "-C", targetPath], {
        stdio: "inherit",
      });
      await remove(target);
      await chmod(this.#dufsPath, 777);
    }

    this.#dufsExists = true;
  };
}
