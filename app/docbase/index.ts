import { DocBase } from "../../src/DocBase";
import meili from "../../.meili.json";

const docBase = new DocBase();

// TODO 改为 .env 尝试使用环境变量初始化
console.log(process.env.EMBEDDING_MODEL);
console.log(process.env.EMBEDDING_URL);
console.log(process.env.EMBEDDING_APIKEY);
console.log(process.env.EMBEDDING_DIMENSIONS);
console.log(process.env.INIT_PATH);
console.log(process.env.MEILI_URL);
console.log(process.env.MEILI_API_KEY);

await docBase.start({
  meiliSearchConfig: { host: meili.host, apiKey: meili.apiKey },
  embeddingConfig: {
    model: "Pro/BAAI/bge-m3",
    url: "https://api.siliconflow.cn/v1/embeddings",
    apiKey: meili.skkey,
    dimensions: 1024,
  },
  initPaths: ["C:\\Users\\SOVLOOKUP\\Desktop\\111111"],
});

export default docBase;
