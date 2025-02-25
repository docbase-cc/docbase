import type { BasePlugin } from "./Plugin";
import { readFile } from "fs/promises";
import { MarkItDown } from "markitdown-ts";
import { extname } from "path";

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
  type: "DocLoader",
  exts: ["md", "txt", "docx", "pdf", "xlsx", "csv", "html"],
  init: async () => {
    // 读取文件内容
    return async (path: string) => {
      const ext = extname(path);
      if (ext === ".md" || ext === ".txt") {
        return await readFile(path, "utf8");
      } else {
        const result = await markitdown.convert(path);
        return result?.text_content || "";
      }
    };
  },
};
