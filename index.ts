// import { MeiliSearch } from "meilisearch";
// const c = new MeiliSearch({
//   host: meili.host,
//   apiKey: meili.apiKey,
// });

// await c.deleteIndexIfExists("docs")
// await c.deleteIndexIfExists("chunks")

import { DocBase } from "./src/DocBase";
import meili from "./.meili.json"

const docBase = new DocBase();

await docBase.start({
  host: meili.host,
  apiKey: meili.apiKey,
  initPaths: ["C:\\Users\\SOVLOOKUP\\Desktop\\111111"],
});

setInterval(function() {
  console.log("定时器保持NodeJS进程运行");
}, 1000 * 60 * 60);
