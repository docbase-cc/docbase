import { client } from "app/client/client.gen";
import { postSearch, type SearchParam } from "app/client";
import { routeVersion } from "core/src";

// 区分开发和生产环境
const urlBase = import.meta.env.DEV ? "http://localhost:3000" : "";

client.setConfig({
  baseUrl: `${urlBase}/${routeVersion}`,
});

export const search = (body: SearchParam) => postSearch({ body });
