import type { BasePlugin } from "./Plugin";
import { readFile } from "fs/promises";

// 文档加载器
// 读取指定路径文档内容
export type DocLoader = (path: string) => string | Promise<string>;

// 文档加载器插件
export interface DocLoaderPlugin<T extends object = {}>
  extends BasePlugin<DocLoader, T> {
  type: "DocLoader";
  exts: string[];
}

// 默认实现 ============

// 默认文档加载器插件
export const defaultDocLoaderPlugin: DocLoaderPlugin = {
  name: "default",
  type: "DocLoader",
  exts: ["md", "txt"],
  init: async () => {
    // 读取文件内容
    return async (path: string) => await readFile(path, "utf8");
  },
};
