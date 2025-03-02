import { createClient } from "@hey-api/openapi-ts";
import apis from "./src/apis";
import { version, name } from "~/package.json";
import fs from "fs";

const openapi = apis.getOpenAPI31Document({
  openapi: "3.1.0",
  info: {
    version: version,
    title: name,
  },
});
const openapiPath = "client/openapi.json";

// 确保目录存在
const dir = openapiPath.split("/").slice(0, -1).join("/");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 将 openapi 写入文件
fs.writeFileSync(openapiPath, JSON.stringify(openapi, null, 2));

createClient({
  input: openapiPath,
  output: "client",
  plugins: ["@hey-api/client-fetch"],
});
