import { z } from "zod";

const pluginSchema = z.object({
    name: z.string(),
    pluginType: z.string(),
    config: z.any()
})

interface DBlayer {
    // 插件表
    plugin: {
        // 增加
    },
    base: {

    },
    config: {

    }
}
