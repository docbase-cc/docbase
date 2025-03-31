<template>
  <Settings />
  <AddBase />
  <Checker v-model:loading="loading" />

  <Bases v-model:model-value="v" />
  <Transition
    enter-active-class="animate-fade-in-up animate-duration-500 animate-ease-out"
    leave-active-class="animate-fade-out-down animate-duration-500 animate-ease-in"
    mode="out-in"
  >
    <SearchMain v-if="!loading" v-model:id="v.target" />
  </Transition>
</template>

<script setup lang="ts">
import { getV0Base } from "app/client";

const loading = ref(true);
const v = ref<{ items: { id: string; name: string }[]; target: string }>({
  items: [],
  target: "",
});

onMounted(async () => {
  const res = await getV0Base();
  v.value.items = res.data!;
});
</script>
