<template>
  <div class="bg-gradient-to-br from-indigo-500 to-purple-600 min-h-screen w-full flex items-center justify-center">
    <div class="w-full max-w-3xl px-4">
      <!-- 搜索框容器 -->
      <div class="relative group w-full">
        <input type="text" placeholder="开始搜索 DocBase..." :class="[
          'w-full px-6 py-4 text-lg rounded-full bg-white/10 backdrop-blur-md border text-white placeholder-white/70 outline-none transition-all duration-300 shadow-lg text-center',
          isLoading ? 'animate-scanning-border' : 'border-white/20 focus:ring-2 focus:ring-white/30'
        ]" @focus="isSearchFocused = true" @blur="isSearchFocused = false" v-model="searchQuery" />
      </div>
      <!-- 搜索结果展示区 -->
      <div v-if="searchQuery" class="mt-6 w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div v-if="isLoading" class="flex justify-center items-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
        <div v-else class="space-y-4">
          <!-- <div v-for="i in 3" :key="i"
            class="p-4 hover:bg-white/10 rounded-lg transition-colors duration-200 cursor-pointer">
            <h3 class="text-white text-lg font-semibold">搜索结果 {{ i }}</h3>
            <p class="text-white/70 mt-1">这是一个示例搜索结果描述，展示了搜索功能的界面效果。</p>
          </div> -->

          <!-- TODO 展示页面 -->
          {{ contents }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
// TODO 封装为组件
import { postSearch, type SearchResult } from "app/client"

const searchQuery = ref('')
const isSearchFocused = ref(false)
const isLoading = ref(false)
const contents = ref<SearchResult[]>([])

import { client } from "app/client/client.gen"
// TODO 区分开发和生产环境
// TODO 一键启动开发环境
client.setConfig({
  baseUrl: "http://localhost:3000/v0"
})

// 监听搜索输入，模拟加载状态
// TODO 防抖
watch(searchQuery, async (newVal) => {
  if (newVal) {
    isLoading.value = true

    const res = await postSearch({
      client,
      body: {
        q: "hello"
      }
    })

    contents.value = res.data!
    isLoading.value = false
  }
})
</script>

<style>
@keyframes scanning-border {
  0% {
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%) 0 0/200% 100%;
    border-color: rgba(255, 255, 255, 0.3);
  }

  100% {
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%) 200% 0/200% 100%;
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.animate-scanning-border {
  position: relative;
  border-width: 2px;
  background-clip: padding-box;
  animation: scanning-border 2s linear infinite;
}

.animate-scanning-border::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  border-radius: 9999px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  z-index: -1;
}
</style>
