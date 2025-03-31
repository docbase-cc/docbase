import { remove, exists, chmod } from "fs-extra";
import { downloadRelease } from "@terascope/fetch-github-release";
import { arch, platform } from "os";
import { spawnSync } from "child_process";
import { isArray } from "es-toolkit/compat";
import { join } from "path";

const dld = async (targetPath: string) => {
  const dufsName = platform() === "win32" ? "dufs.exe" : "dufs";
  const dufsPath = join(targetPath, dufsName);
  const dufsExists = await exists(dufsPath);
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
    const target = join(targetPath, dufsName);
    spawnSync("tar", ["-zxvf", target, "-C", target], {
      stdio: "inherit",
    });
    await remove(target);
    await chmod(target, 777);
  }
};

await dld("dist/main");
