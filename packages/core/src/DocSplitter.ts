import { AnyZodObject, z } from "zod";
import type { BasePlugin } from "./Plugin";
import { version } from "~/package.json";

// 文档分割器
// 将输入的文本分割成多个文本块
/**
 * 文档分割器类型定义
 * @param text - 输入的文本内容
 * @returns 返回分割后的文本块数组或Promise
 */
export type DocSplitter = (text: string) => string[] | Promise<string[]>;

/**
 * 文档分割器插件接口
 * @template T - 插件参数类型，默认为空对象
 */
export interface DocSplitterPlugin<T extends AnyZodObject = AnyZodObject>
  extends BasePlugin<DocSplitter, T> {
  /** 插件类型，固定为"DocSplitter" */
  type: "DocSplitter";
}

const DocSplitterPluginParams = z.object({
  /** 每个文本块的长度 */
  len: z.number(),
})

// 默认实现 ============

// 默认文档分割器插件
/**
 * 默认文档分割器插件实现
 * 按固定长度分割文本
 */
export const defaultDocSplitterPlugin: DocSplitterPlugin<typeof DocSplitterPluginParams> = {
  name: "default",
  version,
  type: "DocSplitter",
  paramsSchema: DocSplitterPluginParams,
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
