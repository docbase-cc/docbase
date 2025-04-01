<template>
  <div class="floating-cards">
    <div v-for="item in items" :key="item.id" class="floating-card">
      <div class="name">
        <span class="name-text">{{ item.name }}</span>
        <span class="name-suffix"> 知识库</span>
      </div>
      <a
        class="id"
        :href="`/dav/${item.id}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="fa fa-external-link"></i> WebDAV 管理
      </a>
      <div class="delete-icon" @click.stop="deleteItem(item.id)">x</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { deleteV0Base } from "app/client";
const items = defineModel<Array<{ id: string; name: string }>>({
  default: () => [
    { id: "1", name: "知识库 1" },
    { id: "2", name: "知识库 2" },
    { id: "3", name: "知识库 3" },
  ],
});

const deleteItem = async (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
  await deleteV0Base({ body: { id } });
};
</script>

<style scoped>
.floating-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

.floating-card {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  color: white;
  position: relative;
  transition: transform 0.3s ease;
}

.floating-card:hover {
  transform: translateY(-10px);
}

.name {
  font-size: 24px;
  text-align: center;
  margin-bottom: 10px;
}

.name-text {
  font-weight: bold;
}

.name-suffix {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.id {
  font-size: 14px;
  position: absolute;
  bottom: 10px;
  text-decoration: underline;
  cursor: pointer;
}

.id i {
  margin-right: 5px;
}

.delete-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
</style>
