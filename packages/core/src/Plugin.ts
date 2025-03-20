import type { DocLoaderPlugin } from "./DocLoader";
import type { DocSplitterPlugin } from "./DocSplitter";
import { AnyZodObject, z } from "zod"

/**
 * 文档内容
 */
export interface Content {
  // 文档内容文本
  text: string;
  // 多模态矢量
  vector?: number[];
}

/**
 * 基础插件接口
 * @template PluginFunc - 插件函数类型，默认为Function
 * @template PluginParams - 插件参数类型，默认为object
 */
export interface BasePlugin<
  PluginFunc extends Function = Function,
  PluginParams extends z.AnyZodObject = z.AnyZodObject
> {
  /** 插件名称 */
  name: string;
  /** 插件类型 */
  type: string;
  /** 插件版本 */
  version: string;
  /** 插件显示名称 */
  displayName?: string;
  /** 插件作者 */
  author?: string;
  /** 插件描述 */
  description?: string;
  /** 插件仓库地址 */
  repository?: string;
  /** 插件网站地址 */
  homepage?: string;
  /** 插件图标 */
  icon?: string;
  /**
   * 插件初始化函数
   * @param params - 插件初始化参数
   * @returns 返回插件函数
   */
  init: (params: z.infer<PluginParams>) => Promise<PluginFunc> | PluginFunc;
}

// docbase 插件接口
export type DocBasePlugin<T extends AnyZodObject = AnyZodObject> =
  // 文档加载器
  | DocLoaderPlugin<T>
  // 文档分割器
  | DocSplitterPlugin<T>;

/**
 * 带启动参数的插件接口
 * @template T - 插件参数类型
 */
export interface PluginWithParams<T extends AnyZodObject = AnyZodObject> {
  /** 插件实例 */
  plugin: DocBasePlugin<T>;
  /** 插件参数 */
  params: z.infer<T>;
}
