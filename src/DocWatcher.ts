import type { BasePlugin } from "./Plugin";
import chokidar, { FSWatcher } from "chokidar";
import { version } from "../package.json";

// 文档监视器
// 监视目录下的文档变化
export type DocWatcher = (params: {
  // 目录路径
  path: string;
  // 过滤函数
  filter: (path: string) => boolean;
  // 增加或更新文档函数
  upsert: (paths: string) => Promise<void>;
  // 删除文档函数
  remove: (path: string) => Promise<void>;
}) => UnWatch | Promise<UnWatch>;

// 取消监视
export type UnWatch = () => void | Promise<void>;

// 文档监视器插件
export interface DocWatcherPlugin<T extends object = {}>
  extends BasePlugin<DocWatcher, T> {
  type: "DocWatcher";
}

// 默认实现 ============

// 默认文档监视器插件
export const defaultDocWatcherPlugin: DocWatcherPlugin = {
  name: "default",
  version,
  type: "DocWatcher",
  init: () => {
    let watcher: FSWatcher | undefined;

    return ({ path, filter, upsert, remove }) => {
      // 过滤需要的路径
      const proc =
        (func: (paths: string) => Promise<void>) => async (path: string) => {
          if (filter(path)) {
            await func(path);
          }
        };

      // 监控 path 目录下的文件变化
      if (watcher) {
        watcher.add(path);
      } else {
        watcher = chokidar
          .watch(path, {
            awaitWriteFinish: true,
            ignoreInitial: true,
          })
          .on("all", (e, p) => {
            proc(async (p) => console.log(e, p))(p);
          })
          .on("add", proc(upsert))
          .on("unlink", proc(remove))
          .on("change", proc(upsert));
      }

      // 返回取消监视函数
      return () => {
        watcher!.unwatch(path);
      };
    };
  },
};
