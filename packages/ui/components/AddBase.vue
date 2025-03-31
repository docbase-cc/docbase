<template>
  <div>
    <!-- 其他内容 -->
    <div
      class="add-button-container"
      @mouseenter="showForm = true"
      @mouseleave="showForm = false"
    >
      <template v-if="showForm">
        <form @submit.prevent="addKnowledgeBase">
          <input
            v-model="knowledgeBaseName"
            type="text"
            placeholder="知识库名称"
            class="input-field"
          />
          <button type="submit" class="submit-button">添加</button>
        </form>
      </template>
      <template v-else>
        <button @click="showForm = true" class="add-button">添加知识库</button>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { putV0Base } from "app/client";
import { ref } from "vue";

const showForm = ref(false);
const knowledgeBaseName = ref("");

const addKnowledgeBase = async () => {
  // 这里添加添加知识库的逻辑
  console.log("添加知识库:", knowledgeBaseName.value);
  await putV0Base({ body: { name: knowledgeBaseName.value } });
  showForm.value = false;
  knowledgeBaseName.value = "";
};
</script>

<style scoped>
.add-button-container {
  position: absolute;
  top: 10px;
  right: 10px;
}

.add-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-button:hover {
  background-color: #0056b3;
}

.input-field {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
}

.submit-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #218838;
}
</style>
