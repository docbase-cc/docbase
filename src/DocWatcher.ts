import type { BasePlugin } from "./Plugin";
import chokidar, { FSWatcher } from "chokidar";
import { version } from "../package.json";

// 文档监视器
// 监视目录下的文档变化
/**
 * 文档监视器类型定义
 * @param params - 监视器参数
 * @param params.path - 要监视的目录路径
 * @param params.filter - 文件路径过滤函数
 * @param params.upsert - 文件添加或更新时的处理函数
 * @param params.remove - 文件删除时的处理函数
 * @returns 返回取消监视的函数或Promise
 */
export type DocWatcher = (params: {
  path: string;
  filter: (path: string) => boolean;
  upsert: (paths: string) => Promise<void>;
  remove: (path: string) => Promise<void>;
}) => UnWatch | Promise<UnWatch>;

/**
 * 取消监视函数类型定义
 */
export type UnWatch = () => void | Promise<void>;

/**
 * 文档监视器插件接口
 * @template T - 插件参数类型，默认为空对象
 */
export interface DocWatcherPlugin<T extends object = {}>
  extends BasePlugin<DocWatcher, T> {
  /** 插件类型，固定为"DocWatcher" */
  type: "DocWatcher";
}

// 默认实现 ============

// 默认文档监视器插件
/**
 * 默认文档监视器插件实现
 * 使用 chokidar 库实现文件系统监视功能
 */
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
