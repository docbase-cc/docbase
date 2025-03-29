import type { BasePlugin, Content } from "./Plugin";
import { IDataType } from "hash-wasm";
import { AsyncStream } from "itertools-ts";

export interface DocLoaderInput {
  path: string;
  hash: (data: IDataType) => Promise<string>;
  read: (path: string) => Promise<string>;
}

/**
 * 文档加载器类型定义
 * @param path - 文档路径
 * @returns 返回加载后的文档对象的迭代器，false 表示不符合条件的文件，跳过处理
 */
export type DocLoader = (input: DocLoaderInput) => Promise<
  | {
      hash: string;
      content: AsyncIterable<Content>;
    }
  | false
>;

/**
 * 文档加载器插件接口
 * @template T - 插件参数类型，默认为空对象
 */
export interface DocLoaderPlugin<T extends object = object>
  extends BasePlugin<DocLoader, T> {
  /** 插件类型，固定为"DocLoader" */
  pluginType: "DocLoader";
  /** 支持的文件扩展名列表 */
  exts: string[];
}

// 默认实现 ============

/**
 * 默认文档加载器插件实现
 * 支持的文件类型包括：md, txt
 */
const defaultDocLoaderPlugin: DocLoaderPlugin = {
  name: "default",
  pluginType: "DocLoader",
  exts: ["md", "txt"],
  func: async ({ path, hash, read }) => {
    // 读取文件内容
    const text = await read(path);

    return {
      // 计算 hash
      hash: await hash(text),
      content: AsyncStream.of([text]),
    };
  },
};

export default defaultDocLoaderPlugin;
