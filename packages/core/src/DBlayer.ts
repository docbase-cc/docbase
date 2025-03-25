import { z } from "zod";
import { PluginWithConfig } from "./Plugin";

const pluginSchema = z.object({
    name: z.string(),
    config: z.any()
})

const baseSchema = z.object({
    name: z.string(),
    id: z.string(),
    path: z.string(),
})

export type Base = z.infer<typeof baseSchema>;

const configSchema = z.object({
    meiliSearchConfig: z.object({}),
})

export interface DBLayer {
    // 配置表
    config: {
        get: () => Promise<z.infer<typeof configSchema>>;
        set: (config: z.infer<typeof configSchema>) => Promise<void>;
    }
    // 插件表
    plugin: {
        // 增加
        add: (plugin: z.infer<typeof pluginSchema>) => Promise<void>;
        // 删除
        delete: (name: string) => Promise<void>
        // 获取
        get: () => Promise<PluginWithConfig[]>;
    },
    // 知识库表
    base: {
        // 增加
        add: (name: string) => Promise<z.infer<typeof baseSchema>>;
        // 删除
        delete: (id: string) => Promise<z.infer<typeof baseSchema>>;
        // 获取
        get: () => Promise<z.infer<typeof baseSchema>[]>;
    }
}
