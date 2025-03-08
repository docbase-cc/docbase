<template>
  <div class="bg-gradient-to-br from-indigo-500 to-purple-600 min-h-screen w-full flex items-center justify-center">
    <div class="w-full max-w-3xl pa-6">
      <!-- 设置 API Token -->
      <Settings />

      <!-- 搜索框容器 -->
      <Searcher v-model="searchVal" />

      <!-- 搜索结果展示区 -->
      <MDCards v-model="searchVal.searchResults" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SearchResult } from "app/client"

const searchVal = reactive({
  q: '',
  searchResults: [] as SearchResult[]
})
</script>
