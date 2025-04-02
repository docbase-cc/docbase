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
