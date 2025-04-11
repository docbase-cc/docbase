import { platform } from "os";
import { arch } from "os";
import AdmZip from "adm-zip";

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

  const downloadURL = target.replace("github.com", "bgithub.xyz");

  const download = async () =>
    new Promise(async (resolve, reject) => {
      let res = await fetch(downloadURL);

      if (res.status !== 200) {
        console.warn("bgithub.xyz 下载失败, 尝试使用 github.com 下载");
        res = await fetch(target);
      }

      new AdmZip(Buffer.from(await res.arrayBuffer())).extractAllToAsync(
        path,
        true,
        true,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(void 0);
          }
        }
      );
    });

  await download();
};
