<template>
  <div class="circular-selector">
    <div
      class="card-container"
      :style="{
        transform: `translateX(-50%) rotateY(${rotation.toString()}deg)`,
      }"
    >
      <div
        v-for="item in model.items"
        :key="item.id"
        class="card"
        :style="{
          transform: `rotateY(${getRotationAngle(
            item.id
          )}deg) translateZ(200px)`,
        }"
        @click="selectItem(item.id)"
      >
        <div class="name">{{ item.name }} 知识库</div>
        <div class="id">WebDAV地址 /dav/{{ item.id }}</div>
        <div class="delete-icon" @click.stop="deleteItem(item.id)">x</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { deleteV0Base } from "app/client";
const model = defineModel<{
  items: Array<{ id: string; name: string }>;
  target: string;
}>({
  default: () => ({
    items: [
      { id: "1", name: "知识库 1" },
      { id: "2", name: "知识库 2" },
      { id: "3", name: "知识库 3" },
    ],
    target: "1",
  }),
});

const rotation = ref(0);

const updateRotation = () => {
  const index = model.value.items.findIndex(
    (item) => item.id === model.value.target
  );
  if (index !== -1) {
    const angle = (360 / model.value.items.length) * index;
    rotation.value = -angle;
  }
};

const getRotationAngle = (id: string) => {
  const index = model.value.items.findIndex((item) => item.id === id);
  return (360 / model.value.items.length) * index;
};

const selectItem = (id: string) => {
  model.value = {
    ...model.value,
    target: id,
  };
};

const deleteItem = async (id: string) => {
  model.value.items = model.value.items.filter((item) => item.id !== id);
  if (model.value.target === id) {
    if (model.value.items.length > 0) {
      model.value.target = model.value.items[0].id;
    } else {
      model.value.target = "";
    }
  }
  await deleteV0Base({ body: { id } });
  updateRotation();
};

onMounted(() => {
  updateRotation();
});

watch(
  () => model.value.target,
  () => {
    updateRotation();
  },
  { immediate: true }
);
</script>

<style scoped>
.circular-selector {
  position: relative;
  width: 400px;
  height: 250px;
  margin: 0 auto;
  perspective: 1000px;
}

.card-container {
  position: absolute;
  left: 50%;
  width: 200px;
  height: 200px;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.card {
  position: absolute;
  width: 200px;
  height: 200px;
  /* 美化背景 */
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  color: white; /* 文字颜色 */
}

.name {
  font-size: 20px;
  text-align: center;
}

.id {
  font-size: 14px;
  position: absolute;
  bottom: 10px;
}

.delete-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
</style>
