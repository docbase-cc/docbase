// import { MeiliSearch } from "meilisearch";
// const c = new MeiliSearch({
//   host: meili.host,
//   apiKey: meili.apiKey,
// });

// await c.deleteIndexIfExists("docs");
// await c.deleteIndexIfExists("chunks");

// import { DocBase } from "./src/DocBase";
// import meili from "./.meili.json";

// const docBase = new DocBase();

// await docBase.start({
//   meiliSearchConfig: { host: meili.host, apiKey: meili.apiKey },
//   embeddingConfig: {
//     model: "Pro/BAAI/bge-m3",
//     url: "https://api.siliconflow.cn/v1/embeddings",
//     apiKey: meili.skkey,
//     dimensions: 1024,
//   },
// });

// console.log("添加知识库...");
// await docBase.addDir("C:\\Users\\SOVLOOKUP\\Desktop\\111111");

// console.log(
//   "docLoaders 插件：",
//   docBase.docLoaders.map((v) => v.name)
// );
// console.log("知识库目录：", docBase.dirs);
// console.log("知识库支持的拓展：", docBase.exts);
// console.log("混合搜索：", await docBase.search("RISC"));

// setInterval(function () {
//   console.log("定时器保持NodeJS进程运行");
// }, 1000 * 60 * 60);
