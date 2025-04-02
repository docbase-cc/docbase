<template>
  <!-- 新增导航栏 -->
  <div
    class="fixed top-0 left-0 right-0 flex justify-center backdrop-blur-md p-2"
  >
    <button
      :class="{ 'font-bold': !search.selected }"
      @click="search.selected = false"
      class="px-4 py-2 mx-2 rounded-md hover:bg-gray-200"
    >
      知识库管理
    </button>
    <button
      :class="{ 'font-bold': search.selected }"
      @click="search.selected = true"
      class="px-4 py-2 mx-2 rounded-md hover:bg-gray-200"
    >
      搜索预览
    </button>
  </div>

  <!-- 加载动画 -->
  <div v-if="loading" class="loading-animation">
    <div class="spinner"></div>
    <p>正在检查系统状态...</p>
  </div>

  <div v-if="!loading">
    <SearchMain v-if="search.selected" v-bind:items="v" />
    <Bases v-else v-model:model-value="v" />
  </div>
</template>

<script setup lang="ts">
import { getV0Base } from "app/client";
import { getSystem } from "app/client";

const search = useSelectSearch();
const loading = ref(true);
const v = ref<{ id: string; name: string }[]>([]);
const route = useRouter();

onMounted(async () => {
  const system = await getSystem();

  loading.value = false;
  if (!system.data?.inited) {
    await route.push("/init");
  } else {
    const base = await getV0Base();
    
    if (base.response.status === 401) {
      await useRouter().push("/401");
    }
    
    v.value = base.data!;
  }
});
</script>

<style scoped>
/* 加载动画样式 */
.loading-animation {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
