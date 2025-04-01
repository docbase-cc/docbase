<template>
  <div class="w-full max-w-3xl pa-6">
    <!-- 知识库选择器 -->
    <select v-model="selectedId">
      <!-- 循环遍历 model.items 生成选项 -->
      <option v-for="item in model.items" :key="item.id" :value="item.id">
        {{ item.name }}
      </option>
    </select>
    <!-- 搜索框容器 -->
    <Searcher v-model="searchVal" />
    <!-- 搜索结果展示区 -->
    <MDCards v-model="searchVal.searchResults" />
  </div>
</template>

<script setup lang="ts">
import { type SearchResult } from "app/client";
import { ref, reactive, watch } from "vue";

const model = defineProps<{
  items: { id: string; name: string }[];
}>();

const selectedId = ref<string>(model.items[0].id ?? "");

const searchVal = reactive({
  id: selectedId.value,
  q: "",
  searchResults: [] as SearchResult[],
});

watch(selectedId, (newId) => {
  searchVal.id = newId;
  // 可以在这里添加重新搜索的逻辑
});
</script>
