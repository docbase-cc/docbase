import { z } from "zod";

const pluginSchema = z.object({
    name: z.string(),
    pluginType: z.enum(["DocLoader", "DocSplitter"]),
    config: z.any()
})

const baseSchema = z.object({
    id: z.string(),
    path: z.string(),
})

const configSchema = z.object({
    meiliSearchConfig: z.object({}),
    fileOpThrottleMs: z.number(),
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
        get: () => Promise<z.infer<typeof pluginSchema>[]>;
    },
    // 知识库表
    base: {
        // 增加
        add: (base: z.infer<typeof baseSchema>) => Promise<void>;
        // 删除
        delete: (id: string) => Promise<void>;
        // 获取
        get: () => Promise<z.infer<typeof baseSchema>[]>;
    }
}
