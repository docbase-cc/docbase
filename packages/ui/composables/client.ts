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
    const selected = ref(true);
    return { selected };
  },
  {
    persist: true,
  }
);
