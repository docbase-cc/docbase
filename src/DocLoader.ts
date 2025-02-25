import type { BasePlugin } from "./Plugin";
import { MarkItDown } from "markitdown-ts";
import { version } from "../package.json";

const markitdown = new MarkItDown();

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
  version,
  type: "DocLoader",
  exts: [
    "md",
    "txt",
    "docx",
    "pdf",
    "xlsx",
    "csv",
    "html",
    "xml",
    "rss",
    "atom",
    "ipynb",
    "zip",
  ],
  init: async () => {
    // 读取文件内容
    return async (path: string) => {
      const result = await markitdown.convert(path);
      return result?.text_content || "";
    };
  },
};
