<template>
  <div
    class="input-group-wrapper"
    :class="{ expanded: isExpanded }"
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
  >
    <div class="icon" v-if="!isExpanded">🔑</div>
    <div class="input-group" v-if="isExpanded">
      <label for="bearer-token">API 密钥</label>
      <div class="input-with-icon">
        <input
          :type="showPassword ? 'text' : 'password'"
          id="bearer-token"
          v-model="tokenStore.token"
          placeholder="请输入您的 Bearer Token"
        />
        <span class="eye-icon" @click="showPassword = !showPassword">
          {{ showPassword ? "👁️" : "👁️‍🗨️" }}
        </span>
      </div>
      <p class="input-hint">请妥善保管您的密钥，不要泄露给他人</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const tokenStore = useTokenStore();
const isExpanded = ref(false);
const showPassword = ref(false);
</script>

<style scoped>
.input-group-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  opacity: 0.5;
  transition: all 0.3s ease;
  z-index: 9999; /* 确保显示在最上方 */
}

.input-group-wrapper.expanded {
  opacity: 1;
}

.icon {
  width: 40px;
  height: 40px;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 20px;
}

.input-group {
  margin: 24px 0;
  width: 300px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 15px;
}

.input-with-icon {
  position: relative;
}

input {
  width: 90%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #f9fafb;
}

input:hover {
  border-color: #d1d5db;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.eye-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.input-hint {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
}
</style>
