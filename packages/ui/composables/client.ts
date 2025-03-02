import { client } from "app/client/client.gen";
import { postSearch, type SearchParam } from "app/client";

// TODO 区分开发和生产环境
// TODO 一键启动开发环境
client.setConfig({
  baseUrl: "http://localhost:3000/v0",
});

export const search = (body: SearchParam) => postSearch({ body });
