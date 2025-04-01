<template>
  <div
    class="init-container"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { client } from "app/client/client.gen";

// 区分开发和生产环境
const urlBase = import.meta.env.DEV ? "http://localhost:3000" : "";

client.setConfig({
  baseUrl: urlBase,
  auth: () => useTokenStore().token,
});
</script>

<style>
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
