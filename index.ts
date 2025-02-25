// import { MeiliSearch } from "meilisearch";
// const c = new MeiliSearch({
//   host: meili.host,
//   apiKey: meili.apiKey,
// });

// await c.deleteIndexIfExists("docs")
// await c.deleteIndexIfExists("chunks")

import { DocBase } from "./src/DocBase";
import meili from "./.meili.json";

const docBase = new DocBase();

await docBase.start({
  meiliSearchConfig: { host: meili.host, apiKey: meili.apiKey },
});

console.log("添加知识库...");
await docBase.addDir("C:\\Users\\SOVLOOKUP\\Desktop\\批示督办库");

console.log(
  "docLoaders 插件：",
  docBase.docLoaders.map((v) => v.name)
);
console.log("知识库目录：", docBase.dirs);
console.log("知识库支持的拓展：", docBase.exts);

setInterval(function () {
  console.log("定时器保持NodeJS进程运行");
}, 1000 * 60 * 60);
