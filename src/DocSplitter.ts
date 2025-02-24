import type { BasePlugin } from "./Plugin";

// 文档分割器
// 将输入的文本分割成多个文本块
export type DocSplitter = (text: string) => string[] | Promise<string[]>;

// 文档分割器插件
export interface DocSplitterPlugin<T extends object = {}>
  extends BasePlugin<DocSplitter, T> {
  type: "DocSplitter";
}

// 默认实现 ============

// 默认文档分割器插件
export const defaultDocSplitterPlugin: DocSplitterPlugin<{
  // 按固定长度分割文本
  len: number;
}> = {
  name: "default",
  type: "DocSplitter",
  init:
    ({ len }) =>
    (text: string) => {
      const result: string[] = [];
      for (let i = 0; i < text.length; i += len) {
        result.push(text.substring(i, i + len));
      }
      return result;
    },
};
