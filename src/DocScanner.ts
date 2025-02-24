import { resolve } from "path";
import type { BasePlugin } from "./Plugin";
import { flatten } from "es-toolkit";
import { fdir } from "fdir";
import { getExtFromPath } from "./Utils";

// 文档扫描器
// 扫描指定路径下的文档, 并将路径传递给 load 函数
export type DocScanner = (params: {
  // 待扫描目录
  dirs: string[];
  // 可加载的拓展名文档
  exts: string[];
  // 加载文档函数
  load: (paths: string[]) => Promise<void>;
}) => Promise<void>;

// 文档扫描器插件
export interface DocScannerPlugin<T extends object = {}>
  extends BasePlugin<DocScanner, T> {
  type: "DocScanner";
}

// 默认实现 ============

// 默认文档扫描器插件
export const defaultDocScannerPlugin: DocScannerPlugin = {
  name: "default",
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
