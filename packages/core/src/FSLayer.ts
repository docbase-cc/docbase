import { slash } from "./Utils";
import { AsyncStream } from "itertools-ts";

export interface DirWatcher {
  onUpsert: (callback: (path: string) => void) => void;
  onRemove: (callback: (path: string) => void) => void;
  unwatch: (path: string) => void;
}

export interface DocManagerFsLayer {
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<import("fs").Stats>;
  read: (path: string) => Promise<string>;
}

export interface DocBaseFSLayerParams extends DocManagerFsLayer {
  scan: (params: { dir: string; exts: string[] }) => AsyncIterable<string>;
  watch: (params: {
    path: string;
    filter: (path: string) => boolean;
  }) => DirWatcher;
}

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
  load: (paths: string) => Promise<void>;
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

export interface FSLayer extends DocManagerFsLayer {
  watcher: Watcher;
  scanner: Scanner;
}

export const createFSLayer = (params: DocBaseFSLayerParams): FSLayer => {
  const watchers = new Map<string, DirWatcher>();
  const { scan, watch } = params;

  // 扫描器
  const scanner: Scanner = async ({ dirs, exts, load }) => {
    for (const dir of dirs) {
      console.info(`Starting to scan directory: ${dir}`);
      const paths = scan({ dir, exts });

      const len = await AsyncStream.of(paths)
        .map((path) => load(slash(path)))
        .toCount();

      console.info(`Scanning directory ${dir} completed, found ${len} files`);
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

      const watcher = watch({ path, filter });

      watcher.onUpsert((p: string) => {
        console.info(`[upsert] ${p}`);
        upsert(slash(p));
      });
      watcher.onRemove((p: string) => {
        console.info(`[remove] ${p}`);
        remove(slash(p));
      });

      watchers.set(path, watcher);
    },
  };

  return { watcher, scanner, ...params };
};
