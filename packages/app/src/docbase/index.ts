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
  MEILI_API_KEY,
} = env;

// 校验参数是否存在
if (
  !EMBEDDING_MODEL ||
  !EMBEDDING_URL ||
  !EMBEDDING_APIKEY ||
  !EMBEDDING_DIMENSIONS ||
  !INIT_PATH ||
  !MEILI_URL
) {
  // 打印缺失的参数
  console.log("以下参数缺失：");
  if (!EMBEDDING_MODEL) console.log("EMBEDDING_MODEL");
  if (!EMBEDDING_URL) console.log("EMBEDDING_URL");
  if (!EMBEDDING_APIKEY) console.log("EMBEDDING_APIKEY");
  if (!EMBEDDING_DIMENSIONS) console.log("EMBEDDING_DIMENSIONS");
  if (!INIT_PATH) console.log("INIT_PATH");
  if (!MEILI_URL) console.log("MEILI_URL");
  throw new Error("参数缺失");
}

// 启动 docBase
console.log("Starting DocBase...");
await docBase.start({
  meiliSearchConfig: { host: MEILI_URL, apiKey: MEILI_API_KEY ?? "" },
  embeddingConfig: {
    model: EMBEDDING_MODEL,
    url: EMBEDDING_URL,
    apiKey: EMBEDDING_APIKEY,
    dimensions: Number(EMBEDDING_DIMENSIONS),
  },
  initPaths: [INIT_PATH],
});

export default docBase;
