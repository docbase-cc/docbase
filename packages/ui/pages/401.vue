<template>
  <div class="error-content">
    <h1 style="color: #FF6347; font-size: 36px; font-weight: bold; margin-bottom: 20px;">未认证</h1>
    <p style="color: #666; font-size: 18px; line-height: 1.6;">你没有权限访问此页面，请点击右下角的小钥匙按钮填写正确的 token 后刷新页面</p>
  </div>
</template>

<script setup lang="ts">
import { getV0Plugin } from "app/client";

getV0Plugin().then((res) => {
  if (res.response.status === 200) {
    useRouter().push("/");
  }
});
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f4f4f4;
}

.error-content {
  text-align: center;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
