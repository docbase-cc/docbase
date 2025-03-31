<template>
  <!-- 加载动画 -->
  <div v-if="loading" class="loading-animation">
    <div class="spinner"></div>
    <p>正在检查系统状态...</p>
  </div>
</template>

<script setup lang="ts">
import { getSystem } from "app/client";
const loading = ref(true);

const route = useRouter();

onMounted(async () => {
  const res = await getSystem();
  if (res.data?.inited !== true) {
    await route.push({ name: "init" });
    loading.value = false;
  } else {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 加载动画样式 */
.loading-animation {
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
