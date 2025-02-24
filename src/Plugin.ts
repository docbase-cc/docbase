// 基础插件接口
export interface BasePlugin<
  PluginFunc extends Function = Function,
  PluginParams extends object = object
> {
  name: string;
  type: "DocWatcher" | "DocLoader" | "DocScanner" | "DocSplitter";
  showName?: string;
  version?: string;
  description?: string;
  url?: string;
  icon?: string;
  init: (params: PluginParams) => Promise<PluginFunc> | PluginFunc;
}
