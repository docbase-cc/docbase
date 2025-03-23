import { DocBase, DocBaseOptions } from "core/src";
import { env } from "process";

// const pluginNames = Object.keys(await pkgManager.list())
// const plugins: DocBasePlugin<object>[] = await Promise.all(pluginNames.map(plugin => pkgManager.import(plugin)))
// 获取插件配置并加载插件

const createDocBaseBasic = async (opt: DocBaseOptions = getDocBaseBasicConfigFromEnv()) => {
  const docBase = new DocBase();

  // 启动 docBase
  await docBase.start(opt);

  return docBase;
};

const getDocBaseBasicConfigFromEnv = (): DocBaseOptions => {
  const {
    // 知识库路径
    INIT_PATH,
    // MeiliSearch地址
    MEILI_URL,
    // MeiliSearchAPI密钥
    MEILI_MASTER_KEY,
  } = env;

  // 校验参数是否存在
  if (
    !INIT_PATH ||
    !MEILI_URL ||
    !MEILI_MASTER_KEY
  ) {
    // 打印缺失的参数
    console.error("参数缺失：");
    if (!INIT_PATH) console.error("INIT_PATH");
    if (!MEILI_URL) console.error("MEILI_URL");
    if (!MEILI_MASTER_KEY) console.error("MEILI_MASTER_KEY");
    throw new Error("参数缺失");
  }

  return {
    meiliSearchConfig: {
      host: MEILI_URL,
      apiKey: MEILI_MASTER_KEY
    },
    initPaths: [INIT_PATH]
  }
}

export { createDocBaseBasic };
