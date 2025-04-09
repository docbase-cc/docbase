<template>
  <Bases v-model:model-value="v" />
</template>

<script setup lang="ts">
const v = ref<{ id: string; name: string }[]>([]);
import { getV0Base } from "app/client";

onMounted(async () => {
  const base = await getV0Base();

  v.value = base.data!;
});
</script>
