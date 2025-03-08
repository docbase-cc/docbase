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
      <div class="fixed bottom-4 right-4" v-show="tokenStore.token">
        <button @click="settings = !settings"
          class="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md bg-white/30 hover:bg-white/40 transition-colors shadow-lg cursor-pointer active:scale-95 active:bg-white/50">
          <Icon name="uil:setting" class="text-white text-2xl" />
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