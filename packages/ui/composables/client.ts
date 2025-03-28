import { client } from "app/client/client.gen";
import { postBaseKnowledgeIdSearch, type SearchParam } from "app/client";

// 区分开发和生产环境
const urlBase = import.meta.env.DEV ? "http://localhost:3000" : "";

export const useTokenStore = defineStore(
  "token",
  () => {
    const token = ref("");

    return { token };
  },
  {
    persist: true,
  }
);

client.setConfig({
  baseUrl: `${urlBase}/v0`,
  auth: () => useTokenStore().token,
});

export const search = (body: SearchParam) =>
  postBaseKnowledgeIdSearch({
    body,
    path: {
      knowledgeId: "",
    },
  });
