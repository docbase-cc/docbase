import "./compression-polyfill";
import { platform, arch } from "os";
import AdmZip from "adm-zip";
import { parseTarGzip } from "nanotar";
import { writeFile } from "fs-extra";
import { join } from "path";
import { spawnSync } from "child_process";
import { chmodSync } from "fs";

const download = (url: string, path: string) =>
  new Promise(async (resolve, reject) => {
    let res: Response;
    let data: Buffer;
    console.log("downloading: " + url);

    if (platform() === "win32") {
      try {
        res = await fetch(url);
        data = Buffer.from(await res.arrayBuffer());
      } catch (error) {
        console.warn("github.com 下载失败, 尝试使用 bgithub.xyz 下载");
        res = await fetch(url.replace("github.com", "bgithub.xyz"));
        data = Buffer.from(await res.arrayBuffer());
      }

      if (res.status !== 200) {
        console.warn("github.com 下载失败, 尝试使用 bgithub.xyz 下载");
        res = await fetch(url.replace("github.com", "bgithub.xyz"));
        data = Buffer.from(await res.arrayBuffer());
      }

      if (url.includes(".tar.gz")) {
        const out = await parseTarGzip(data);
        const dufs = out.at(0)!;
        await writeFile(join(path, dufs.name), dufs.data!);
        resolve(void 0);
      } else {
        new AdmZip(data).extractAllToAsync(path, true, true, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(void 0);
          }
        });
      }
    } else {
      spawnSync("sh", ["-c", `curl -L ${url} | tar xz -C ${path}`]);
      chmodSync(join(path, "dufs"), 0o755);
      resolve(void 0);
    }
  });

export const downloadDufs = async (
  path: string,
  repo: string = "sigoden/dufs"
) => {
  const response = await fetch(`https://ungh.cc/repos/${repo}/releases/latest`);
  const a = arch()
    .replace("arm64", "aarch64")
    .replace("ia32", "i686")
    .replace("x64", "x86_64");

  const p = platform().replace("win32", "windows");

  const f = (name: string) => name.includes(p) && name.includes(a);

  const { release } = await response.json();
  const { assets } = release;

  const target: string = assets
    .map((i: { downloadUrl: string }) => i.downloadUrl)
    .find(f);

  await download(target, path);
};
