<template>
  <Init />
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
