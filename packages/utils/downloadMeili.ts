import { createWriteStream } from "fs-extra";
import { platform, arch } from "os";
import { Readable } from "stream";

async function downloadFile(url: string, outputPath: string) {
  console.log("downloading: " + url);
  try {
    let response = await fetch(url);

    if (response.status !== 200) {
      console.warn("github.com 下载失败, 尝试使用 bgithub.xyz 下载");
      response = await fetch(url.replace("github.com", "bgithub.xyz"));
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 将Web流转换为Node.js流
    // @ts-ignore
    const nodeStream = Readable.fromWeb(response.body);

    // 创建写入流
    const fileStream = createWriteStream(outputPath);

    // 将响应流管道到写入流
    await new Promise((resolve, reject) => {
      nodeStream.pipe(fileStream);
      nodeStream.on("error", reject);
      // @ts-ignore
      fileStream.on("finish", resolve);
    });

    console.log("文件下载完成");
  } catch (error) {
    console.error("下载文件时出错:", error);
  }
}

const getName = () => {
  const p = platform();
  const a = arch();

  if (p === "win32") {
    if (a !== "x64") throw new Error("windows only support x64");
    return "meilisearch-windows-amd64.exe";
  } else if (p === "darwin") {
    if (a === "arm64") {
      return "meilisearch-macos-apple-silicon";
    } else if (a === "x64") {
      return "meilisearch-macos-amd64";
    } else {
      throw new Error("macos only support arm64 and x64");
    }
  } else if (p === "linux") {
    if (a === "arm64") {
      return "meilisearch-linux-aarch64";
    } else if (a === "x64") {
      return "meilisearch-linux-amd64";
    } else {
      throw new Error("linux only support arm64 and x64");
    }
  } else {
    throw new Error("unsupported platform");
  }
};

export const downloadMeilisearch = async (
  path: string,
  repo: string = "meilisearch/meilisearch"
) => {
  const response = await fetch(`https://ungh.cc/repos/${repo}/releases/latest`);

  const { release } = await response.json();
  const { assets } = release;
  const name = getName();

  const target = (assets as { downloadUrl: string }[])
    .map((i) => i.downloadUrl)
    .find((i) => i.includes(name))!;

  await downloadFile(
    target,
    `${path}/meilisearch` + (platform() === "win32" ? ".exe" : "")
  );
};
