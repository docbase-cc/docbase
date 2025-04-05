<template>
  <SearchMain v-bind:items="v" />
</template>

<script setup lang="ts">
const v = ref<{ id: string; name: string }[]>([]);
import { getV0Base } from "app/client";

onMounted(async () => {
  const base = await getV0Base();
  if (base.response.status === 401) {
    await useRouter().push("/401");
  } else {
    v.value = base.data!;
  }
});
</script>
