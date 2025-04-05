<template>
  <div
    class="init-container"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0"
  >
    <!-- 加载动画 -->
    <div v-if="loading" class="loading-animation">
      <div class="spinner"></div>
      <p>正在检查系统状态...</p>
    </div>

    <div v-if="!loading" class="mt-10">
      <div
        class="fixed top-0 left-0 right-0 flex justify-center backdrop-blur-md p-2"
      >
        <nuxt-link
          to="/"
          class="px-4 py-2 mx-2 rounded-md hover:bg-gray-200 bg-white/50 text-gray-700 shadow-md transition-all duration-300 ease-in-out no-underline focus:bg-gray-300/50"
        >
          知识库管理
        </nuxt-link>
        <nuxt-link
          to="/search"
          class="px-4 py-2 mx-2 rounded-md hover:bg-gray-200 bg-white/50 text-gray-700 shadow-md transition-all duration-300 ease-in-out no-underline focus:bg-gray-300/50"
        >
          搜索预览
        </nuxt-link>
        <nuxt-link
          to="/plugins"
          class="px-4 py-2 mx-2 rounded-md hover:bg-gray-200 bg-white/50 text-gray-700 shadow-md transition-all duration-300 ease-in-out no-underline focus:bg-gray-300/50"
        >
          插件管理
        </nuxt-link>
      </div>

      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <Settings />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getSystem } from "app/client";

const loading = ref(true);

const route = useRouter();

onMounted(async () => {
  const system = await getSystem();

  loading.value = false;
  if (!system.data?.inited) {
    await route.push("/init");
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

.init-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: "Inter", sans-serif;
  padding: 2rem;
}
</style>
