import { client } from "app/client/client.gen";

// 区分开发和生产环境
const urlBase = import.meta.env.DEV ? "http://localhost:3000" : "";

client.setConfig({
  baseUrl: urlBase,
  auth: () => useTokenStore().token,
});

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

export const useSelectSearch = defineStore(
  "selectSearch",
  () => {
    const selected = ref(false);
    return { selected };
  },
  {
    persist: true,
  }
);
