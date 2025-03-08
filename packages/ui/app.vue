<template>
  <div class="bg-gradient-to-br from-indigo-500 to-purple-600 min-h-screen w-full flex items-center justify-center">
    <div class="w-full max-w-3xl pa-6">
      <!-- 设置 -->
      <Transition enter-active-class="animate-fade-in-up animate-duration-500 animate-ease-out"
        leave-active-class="animate-fade-out-down animate-duration-500 animate-ease-in" mode="out-in">
        <Settings v-if="settings" />
      </Transition>

      <Transition enter-active-class="animate-fade-in-down animate-duration-500 animate-ease-out"
        leave-active-class="animate-fade-out-up animate-duration-500 animate-ease-in" mode="out-in">
        <div v-if="!settings">
          <!-- 搜索框容器 -->
          <Searcher v-model="searchVal" />

          <!-- 搜索结果展示区 -->
          <MDCards v-model="searchVal.searchResults" />
        </div>
      </Transition>

      <!-- 设置按钮 -->
      <div class="fixed bottom-4 right-4">
        <button @click="settings = !settings"
          class="bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all duration-500"
          :class="{ 'rotate-180 transform': settings }">
          <i class="i-carbon-settings text-white text-xl" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SearchResult } from "app/client"

const tokenStore = useTokenStore()

const settings = ref(tokenStore.token ? false : true)
const searchVal = reactive({
  q: '',
  searchResults: [] as SearchResult[]
})
</script>