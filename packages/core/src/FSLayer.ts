import { fdir } from "fdir";
import { getExtFromPath, slash } from "./Utils";
import { watch } from "chokidar";

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

interface WatchAction {
  filter: (path: string) => boolean;
  upsert: (path: string) => void;
  remove: (path: string) => void;
}

// 监视器
export type Watcher = {
  getWatchedPaths: () => string[];
  unwatch: (path: string) => boolean;
  watch: (path: string, actions: WatchAction) => void;
};

export const FSLayer = () => {
  const fd = new fdir().withBasePath();
  const watchers = new Map<string, { unwatch: (path: string) => void }>();

  // 扫描器
  const scanner: Scanner = async ({ dirs, exts, load }) => {
    for (const dir of dirs) {
      console.info(`Starting to scan directory: ${dir}`);
      const outs = await fd
        .filter((path) => {
          const ext = getExtFromPath(path);
          return exts.includes(ext);
        })
        .crawl(dir)
        .withPromise();
      console.info(
        `Scanning directory ${dir} completed, found ${outs.length} files`
      );
      await load(outs.map((path) => slash(path)));
    }
  };

  const watcher = {
    getWatchedPaths: () => watchers.keys().toArray(),
    unwatch: (path: string) => {
      watchers.get(path)?.unwatch(path);
      return watchers.delete(path);
    },
    watch: (path: string, actions: WatchAction) => {
      const { filter, upsert, remove } = actions;

      const addOrChange = (p: string) => {
        if (filter(p)) {
          console.info(`[upsert] ${p}`);
          upsert(slash(p));
        }
      };

      const unlink = (p: string) => {
        if (filter(p)) {
          console.info(`[remove] ${p}`);
          remove(slash(p));
        }
      };

      const watcher = watch(path)
        .on("add", addOrChange)
        .on("change", addOrChange)
        .on("unlink", unlink);

      watchers.set(path, watcher);
    },
  };

  return { watcher, scanner };
};
