import { fdir } from "fdir";
import { DirectoryWatcher } from "filesystem-notify";
import { getExtFromPath, slash } from "./Utils";

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

/**
 * 文件系统监视勾子
 * @param event
 * @param actions
 */
const eventHook = (event: string, actions: WatchAction) => {
  const { filter, upsert, remove } = actions;
  try {
    const e = JSON.parse(event);
    const type = e.event.type;
    const path = e.event.paths[0];

    // 过滤需要的路径
    if (filter(path)) {
      console.info(`[${type}] ${path}`);
      if (type === "create" || type === "modify") {
        upsert(slash(path));
      } else if (type === "remove") {
        remove(slash(path));
      }
    }
  } catch (parseError) {
    console.error(`Error parsing event data: ${parseError}`);
  }
};

export const FSLayer = () => {
  const fd = new fdir().withBasePath();
  const watchers = new Map<string, Watcher>();

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
      const watcher = DirectoryWatcher.new((_err, event) =>
        eventHook(event, actions)
      );
      watcher.watch(path);
      watchers.set(path, watcher);
    },
  };

  return { watcher, scanner };
};
