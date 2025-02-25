import type { DocLoaderPlugin } from "./DocLoader";
import type { DocScannerPlugin } from "./DocScanner";
import type { DocSplitterPlugin } from "./DocSplitter";
import type { DocWatcherPlugin } from "./DocWatcher";

// 基础插件
export interface BasePlugin<
  PluginFunc extends Function = Function,
  PluginParams extends object = object
> {
  // 插件名称
  name: string;
  // 插件类型
  type: string;
  // 插件版本
  version: string;
  // 插件显示名称
  showName?: string;
  // 插件作者
  author?: string;
  // 插件描述
  description?: string;
  // 插件仓库或网站地址
  url?: string;
  // 插件图标
  icon?: string;
  // 插件初始化函数
  init: (params: PluginParams) => Promise<PluginFunc> | PluginFunc;
}

// docbase 插件接口
export type DocBasePlugin<T extends object> =
  // 文档加载器
  | DocLoaderPlugin<T>
  // 文档监视器
  | DocWatcherPlugin<T>
  // 文档扫描器
  | DocScannerPlugin<T>
  // 文档分割器
  | DocSplitterPlugin<T>;

// 带启动参数的插件
export interface PluginWithParams<T extends object> {
  plugin: DocBasePlugin<T>;
  params: T;
}
