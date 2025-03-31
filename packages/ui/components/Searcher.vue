<template>
  <!-- 搜索框容器 -->
  <div class="relative group flex justify-center w-full">
    <input
      type="text"
      placeholder="开始搜索 DocBase..."
      :class="[
        'w-3/4 px-6 py-4 text-lg rounded-full bg-white/10 backdrop-blur-md border text-white placeholder-white/70 outline-none transition-all duration-300 shadow-lg text-center',
        isLoading
          ? 'animate-scanning-border'
          : 'border-white/20 focus:ring-2 focus:ring-white/30',
      ]"
      @focus="isSearchFocused = true"
      @blur="isSearchFocused = false"
      v-model="fields.q"
    />
  </div>
</template>

<script setup lang="ts">
import { postV0BaseKnowledgeIdSearch, type SearchResult } from "app/client";
import { debounce } from "es-toolkit";

const fields = defineModel<{
  id: string;
  q: string;
  searchResults: SearchResult[];
}>({ default: { q: "", searchResults: [], id: "" } });

const isSearchFocused = ref(false);
const isLoading = ref(false);

// 监听搜索输入，加载数据(已防抖)
watch(
  () => fields.value.q,
  debounce(async (newVal) => {
    if (newVal) {
      isLoading.value = true;

      const res = await postV0BaseKnowledgeIdSearch({
        body: {
          q: newVal,
          showRankingScore: true,
          rankingScoreThreshold: 0.8,
        },
        path: {
          knowledgeId: fields.value.id,
        },
      });

      fields.value.searchResults = res.data!;

      isLoading.value = false;
    } else {
      fields.value.searchResults = [];
    }
  }, 400)
);
</script>

<style>
@keyframes scanning-border {
  0% {
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.8) 50%,
        transparent 100%
      )
      0 0/200% 100%;
    border-color: rgba(255, 255, 255, 0.3);
  }

  100% {
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.8) 50%,
        transparent 100%
      )
      200% 0/200% 100%;
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
  content: "";
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  border-radius: 9999px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.8),
    transparent
  );
  z-index: -1;
}
</style>
