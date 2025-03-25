import type { BasePlugin, Content } from "./Plugin";

// 文档分割器
// 将输入的文本分割成多个文本块
/**
 * 文档分割器类型定义
 * @param text - 输入的文本内容
 * @returns 返回分割后的文本块数组或Promise
 */
export type DocSplitter = (text: AsyncIterable<Content>) => AsyncIterable<{
  // 文档内容文本
  text: string;
  // 多模态矢量
  _vectors?: { [key: string]: number[] };
}>;

/**
 * 文档分割器插件接口
 * @template T - 插件参数类型，默认为空对象
 */
export interface DocSplitterPlugin<T extends object = object>
  extends BasePlugin<DocSplitter, T> {
  /** 插件类型，固定为"DocSplitter" */
  pluginType: "DocSplitter";
}

// 默认实现 ============
import { AsyncStream } from "itertools-ts";

const cutToLen = (text: string, len: number) => {
  const result: string[] = [];
  for (let i = 0; i < text.length; i += len) {
    result.push(text.substring(i, i + len));
  }
  return result.map((text) => ({ text }));
};

// 默认文档分割器插件
/**
 * 默认文档分割器插件实现
 * 按固定长度分割文本
 */
class defaultDocSplitterPlugin implements DocSplitterPlugin<{ len: number }> {
  name = "default";
  pluginType: "DocSplitter" = "DocSplitter";
  #len: number;
  init = async ({ len }: { len: number }) => {
    this.#len = len;
  };
  func: DocSplitter = (text) =>
    AsyncStream.of(text)
      .map((text) => cutToLen(text, this.#len))
      .flatten() as AsyncStream<{ text: string }>;
}

export default new defaultDocSplitterPlugin();
