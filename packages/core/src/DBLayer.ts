import { PluginWithConfig } from "./Plugin";

// MeiliSearch 配置接口
export interface MeiliSearchConfig {
  host: string; // 必须是有效的 URL
  apiKey?: string;
  clientAgents?: string[];
  timeout?: number;
}

// 知识库基础信息接口
export interface Base {
  // ID
  id: string;
  // 名称
  name: string;
  // 路径
  path: string;
}

// 配置接口
export interface DocBaseConfig {
  meiliSearchConfig: MeiliSearchConfig;
}

// 数据库层接口
export interface DBLayer {
  // 插件表
  plugins: () => AsyncIterable<PluginWithConfig>;
  // 配置表
  getConfig: () => Promise<DocBaseConfig>;
  // 知识库表
  knowledgeBase: {
    // 增加
    add: (name: string) => Promise<Base>;
    // 删除
    del: (id: string) => Promise<Base>;
    // 获取
    all: () => AsyncIterable<Base>;
  };
}
