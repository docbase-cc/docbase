import { fdir } from "fdir";
import { DirectoryWatcher } from "filesystem-notify";
import { getExtFromPath } from "./Utils";

/**
 * 扫描器类型定义
 * @param params - 扫描器参数
 * @param params.dirs - 要扫描的目录数组
 * @param params.exts - 支持的文件扩展名数组
 * @param params.load - 加载文档的回调函数
 */
export type Scanner = (params: {
  dirs: string[];
  exts: string[];
  load: (paths: string[]) => Promise<void>;
}) => Promise<void>;

// 监视器
export type Watcher = Pick<
  DirectoryWatcher,
  "getWatchedPaths" | "unwatch" | "watch"
>;

export const FSLayer = ({ filter, upsert, remove }) => {
  const fd = new fdir().withBasePath();

  // 扫描器
  const scanner: Scanner = async ({ dirs, exts, load }) => {
    for (const dir of dirs) {
      const outs = await fd
        .filter((path) => {
          const ext = getExtFromPath(path);
          return exts.includes(ext);
        })
        .crawl(dir)
        .withPromise();

      await load(outs);
    }
  };

  // 监视器
  const watcher: DirectoryWatcher = DirectoryWatcher.new(
    async (_err, event) => {
      const e = JSON.parse(event);
      const type = e.event.type;
      const path = e.event.paths[0];

      // 过滤需要的路径
      if (filter(path)) {
        console.log(`[${type}] ${path}`);
        if (type === "create" || type === "modify") {
          await upsert(path);
        } else if (type === "remove") {
          await remove(path);
        }
      }
    }
  );

  return { watcher, scanner };
};
