import { ofetch } from "ofetch";
import { platform } from "os";
import { arch } from "os";
import unzip from "unzipper";

export const downloadDufs = async (
  path: string,
  repo: string = "sigoden/dufs"
) => {
  const { release } = await ofetch(
    `https://ungh.cc/repos/${repo}/releases/latest`
  );
  const a = arch()
    .replace("arm64", "aarch64")
    .replace("ia32", "i686")
    .replace("x64", "x86_64");

  const p = platform().replace("win32", "windows");

  const f = (name: string) => name.includes(p) && name.includes(a);

  const { assets } = release;

  const target: string = assets
    .map((i: { downloadUrl: string }) => i.downloadUrl)
    .find(f);

  const downloadURL = target.replace("github.com", "bgithub.xyz");

  const blob: Blob = await ofetch(downloadURL, { duplex: "half" });

  const files = await unzip.Open.buffer(Buffer.from(await blob.arrayBuffer()));

  await files.extract({ path, forceStream: true });
};
