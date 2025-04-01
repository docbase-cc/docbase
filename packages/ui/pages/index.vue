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

  <Settings />
  <Checker v-model:loading="loading" />

  <AddBase v-if="!search.selected" />
  <Transition
    enter-active-class="animate-fade-in-up animate-duration-500 animate-ease-out"
    leave-active-class="animate-fade-out-down animate-duration-500 animate-ease-in"
    mode="out-in"
    v-if="!loading"
  >
    <SearchMain v-if="search.selected" v-bind:items="v" />
    <Bases v-else v-model:model-value="v" />
  </Transition>
</template>

<script setup lang="ts">
import { getV0Base } from "app/client";
const search = useSelectSearch();
const loading = ref(true);
const v = ref<{ id: string; name: string }[]>([]);

onMounted(async () => {
  const res = await getV0Base();
  v.value = res.data!;
});
</script>
