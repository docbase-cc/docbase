<template>
  <div class="w-full max-w-3xl pa-6">
    <!-- 设置 -->
    <Transition
      enter-active-class="animate-fade-in-up animate-duration-500 animate-ease-out"
      leave-active-class="animate-fade-out-down animate-duration-500 animate-ease-in"
      mode="out-in"
    >
      <Settings v-if="settings" />
    </Transition>

    <Transition
      enter-active-class="animate-fade-in-down animate-duration-500 animate-ease-out"
      leave-active-class="animate-fade-out-up animate-duration-500 animate-ease-in"
      mode="out-in"
    >
      <div v-if="!settings">
        <!-- 搜索框容器 -->
        <Searcher v-model="searchVal" />

        <!-- 搜索结果展示区 -->
        <MDCards v-model="searchVal.searchResults" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { type SearchResult } from "app/client";

const id = defineModel("id", {
  type: String,
  default: () => "",
});

const tokenStore = useTokenStore();

const settings = ref(tokenStore.token ? false : true);
const searchVal = reactive({
  id: id.value,
  q: "",
  searchResults: [] as SearchResult[],
});
</script>
