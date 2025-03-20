import { DocBase } from "core/src";
import { env } from "process";

const docBase = new DocBase();

const {
  // 嵌入模型名称
  EMBEDDING_MODEL,
  // 嵌入模型地址
  EMBEDDING_URL,
  // 嵌入模型API密钥
  EMBEDDING_APIKEY,
  // 嵌入模型维度
  EMBEDDING_DIMENSIONS,
  // 知识库路径
  INIT_PATH,
  // MeiliSearch地址
  MEILI_URL,
  // MeiliSearchAPI密钥
  MEILI_MASTER_KEY,
} = env;

// 校验参数是否存在
if (
  !EMBEDDING_MODEL ||
  !EMBEDDING_URL ||
  !EMBEDDING_APIKEY ||
  !EMBEDDING_DIMENSIONS ||
  !INIT_PATH ||
  !MEILI_URL ||
  !MEILI_MASTER_KEY
) {
  // 打印缺失的参数
  console.error("以下参数缺失：");
  if (!EMBEDDING_MODEL) console.error("EMBEDDING_MODEL");
  if (!EMBEDDING_URL) console.error("EMBEDDING_URL");
  if (!EMBEDDING_APIKEY) console.error("EMBEDDING_APIKEY");
  if (!EMBEDDING_DIMENSIONS) console.error("EMBEDDING_DIMENSIONS");
  if (!INIT_PATH) console.error("INIT_PATH");
  if (!MEILI_URL) console.error("MEILI_URL");
  if (!MEILI_MASTER_KEY) console.error("MEILI_MASTER_KEY");
  throw new Error("参数缺失");
}

// 启动 docBase
await docBase.start({
  meiliSearchConfig: { host: MEILI_URL, apiKey: MEILI_MASTER_KEY },
  embeddingConfig: {
    model: EMBEDDING_MODEL,
    url: EMBEDDING_URL,
    apiKey: EMBEDDING_APIKEY,
    dimensions: Number(EMBEDDING_DIMENSIONS),
  },
  initPaths: [INIT_PATH],
});

export default docBase;
