import type { DocLoaderPlugin } from "./DocLoader";
import type { DocSplitterPlugin } from "./DocSplitter";

/**
 * 文档内容类型
 */
export type Content = string;

/**
 * 基础插件接口
 * @template PluginFunc - 插件函数类型，默认为Function
 * @template PluginParams - 插件参数类型，默认为object
 */
export interface BasePlugin<
  PluginFunc extends Function = Function,
  PluginParams extends object = object
> {
  /** 插件名称 */
  name: string;
  /** 插件类型 */
  pluginType: string;
  /**
   * 插件初始化函数
   * @param params - 插件初始化参数
   */
  init?: (params: PluginParams) => Promise<void>;
  /** 插件函数 */
  func: PluginFunc;
}

/**
 * 插件package.json类型
 */
export interface PluginPakageJSON {
  /** 插件名称 */
  name: string;
  /** 插件类型 */
  pluginType: string;
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
}

// docbase 插件接口
export type DocBasePlugin<T extends object = object> =
  // 文档加载器
  | DocLoaderPlugin<T>
  // 文档分割器
  | DocSplitterPlugin<T>;

/**
 * 带启动参数的插件接口
 * @template T - 插件参数类型
 */
export interface PluginWithConfig<T extends object = object> {
  /** 插件实例 */
  plugin: DocBasePlugin<T>;
  /** 插件参数 */
  config: T;
}
