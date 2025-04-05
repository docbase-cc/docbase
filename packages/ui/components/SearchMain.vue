<template>
  <div class="w-full max-w-3xl">
    <!-- 美化后的知识库选择器和搜索框放在一行 -->
    <div class="flex">
      <!-- 添加一个容器用于样式布局，减少宽度 -->
      <div class="flex-shrink-0 w-48">
        <label
          for="knowledge-base-select"
          class="block text-sm font-medium text-gray-700 text-center"
          >选择知识库检索</label
        >
        <!-- 添加标签 -->
        <select
          id="knowledge-base-select"
          v-model="selectedId"
          class="bg-white border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
        >
          <!-- 循环遍历 model.items 生成选项 -->
          <option v-for="item in model.items" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>
      <div class="flex-1">
        <Searcher v-model="searchVal" />
      </div>
    </div>
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

const selectedId = ref<string>(model.items.at(0)?.id ?? "");

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
