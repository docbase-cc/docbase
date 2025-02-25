import type { BasePlugin } from "./Plugin";
import { fdir } from "fdir";
import { getExtFromPath } from "./Utils";
import { version } from "../package.json";

// 文档扫描器
// 扫描指定路径下的文档, 并将路径传递给 load 函数
/**
 * 文档扫描器类型定义
 * @param params - 扫描器参数
 * @param params.dirs - 要扫描的目录数组
 * @param params.exts - 支持的文件扩展名数组
 * @param params.load - 加载文档的回调函数
 */
export type DocScanner = (params: {
  dirs: string[];
  exts: string[];
  load: (paths: string[]) => Promise<void>;
}) => Promise<void>;

/**
 * 文档扫描器插件接口
 * @template T - 插件参数类型，默认为空对象
 */
export interface DocScannerPlugin<T extends object = {}>
  extends BasePlugin<DocScanner, T> {
  /** 插件类型，固定为"DocScanner" */
  type: "DocScanner";
}

// 默认实现 ============

// 默认文档扫描器插件
/**
 * 默认文档扫描器插件实现
 * 使用 fdir 库实现目录扫描功能
 */
export const defaultDocScannerPlugin: DocScannerPlugin = {
  name: "default",
  version,
  type: "DocScanner",
  init: async () => {
    const fd = new fdir().withBasePath();

    return async ({ dirs, exts, load }) => {
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
  },
};
