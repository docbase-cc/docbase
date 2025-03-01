import type { BasePlugin } from "./Plugin";
import { MarkItDown } from "markitdown-ts";
import { version } from "~/package.json";

const markitdown = new MarkItDown();

/**
 * 文档加载器类型定义
 * @param path - 文档路径
 * @returns 返回文档内容字符串或Promise
 */
export type DocLoader = (path: string) => string | Promise<string>;

/**
 * 文档加载器插件接口
 * @template T - 插件参数类型，默认为空对象
 */
export interface DocLoaderPlugin<T extends object = {}>
  extends BasePlugin<DocLoader, T> {
  /** 插件类型，固定为"DocLoader" */
  type: "DocLoader";
  /** 支持的文件扩展名列表 */
  exts: string[];
}

// 默认实现 ============

/**
 * 默认文档加载器插件实现
 * 支持的文件类型包括：md, txt, docx, pdf, xlsx, csv, html, xml, rss, atom, ipynb, zip
 */
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
