import type { BasePlugin } from "./Plugin";
import { DirectoryWatcher } from "filesystem-notify";
import { version } from "~/package.json";

// 文档监视器
// 监视目录下的文档变化
/**
 * 文档监视器参数定义
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
    let watcher: DirectoryWatcher = null;

    return ({ filter, upsert, remove, path }) => {
      if (watcher === null) {
        watcher = DirectoryWatcher.new(async (_err, event) => {
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
        });
      }

      // 开始监视目录
      watcher.watch(path);

      // 返回取消监视函数
      return () => watcher.unwatch(path);
    };
  },
};
