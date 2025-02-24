import type { DocLoaderPlugin } from "./DocLoader";
import type { DocScannerPlugin } from "./DocScanner";
import type { DocSplitterPlugin } from "./DocSplitter";
import type { DocWatcherPlugin } from "./DocWatcher";

// 基础插件接口
export interface BasePlugin<
  PluginFunc extends Function = Function,
  PluginParams extends object = object
> {
  name: string;
  type: string;
  showName?: string;
  version?: string;
  description?: string;
  url?: string;
  icon?: string;
  init: (params: PluginParams) => Promise<PluginFunc> | PluginFunc;
}

export type DocBasePlugin<T extends object> =
  | DocLoaderPlugin<T>
  | DocWatcherPlugin<T>
  | DocScannerPlugin<T>
  | DocSplitterPlugin<T>;
