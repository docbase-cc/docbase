<script setup lang="ts">
import { getSystem, postSystem } from "app/client";
const initialized = ref(false);
const loading = ref(true);
const showForm = ref(false);
const formData = ref({
  host: "",
  apiKey: "",
});
const status = ref<"idle" | "success" | "error">("idle");
const showSuccessPage = ref(false); // 新增变量，用于控制显示初始化成功页面
const errorMessage = ref(""); // 新增变量，用于存储错误消息

onMounted(async () => {
  try {
    const res = await getSystem();
    initialized.value = res.data?.inited === true;
    if (initialized.value) {
      showSuccessPage.value = true; // 已初始化，显示初始化成功页面
      setTimeout(() => {
        window.location.href = "https://docbase.cc"; // 3秒后跳转到 docbase.cc
      }, 3000);
    } else {
      showForm.value = true;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const submitForm = async () => {
  status.value = "idle";
  errorMessage.value = ""; // 提交表单前清空错误消息
  const res = await postSystem({ body: formData.value });
  if (res.data?.inited === true) {
    status.value = "success";
    showSuccessPage.value = true; // 初始化成功，显示初始化成功页面
  } else {
    status.value = "error";
    errorMessage.value =
      res.error?.msg.replace(
        "failed to connect to meilisearch",
        "连接 MeiliSearch 失败"
      ) || "未知错误"; // 存储错误消息
  }
};
</script>

<template>
  <div class="init-container">
    <!-- 加载动画 -->
    <div v-if="loading" class="loading-animation">
      <div class="spinner"></div>
      <p>正在检查系统状态...</p>
    </div>
    <div v-else>
      <!-- 已初始化状态 -->
      <div v-if="showSuccessPage" class="initialized-state">
        <div class="checkmark">✓</div>
        <h1>系统初始化成功</h1>
        <p>3 秒后跳转到 docbase.cc...</p>
        <div class="progress-bar">
          <div class="progress"></div>
        </div>
      </div>

      <!-- 初始化表单 -->
      <div v-else class="init-form">
        <h1 style="text-align: center">欢迎使用 <span class="gradient-text">DocBase</span></h1>
        <p style="text-align: center">
          请填写 MeiliSearch 引擎配置完成系统初始化
        </p>

        <div
          v-if="errorMessage"
          class="error-message"
          style="display: flex; justify-content: center; align-items: center"
        >
          <i class="error-icon">⚠</i>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label>Meilisearch Host</label>
            <input
              v-model="formData.host"
              type="text"
              placeholder="http://localhost:7700"
              required
            />
          </div>

          <div class="form-group">
            <label>Meilisearch apiKey</label>
            <input
              v-model="formData.apiKey"
              type="password"
              placeholder="输入您的API密钥"
              required
            />
          </div>

          <button type="submit" :disabled="status === 'success'">
            <span v-if="status === 'idle'">初始化系统</span>
            <span v-else-if="status === 'success'" class="success-text"
              >✓ 初始化成功</span
            >
            <span v-else-if="status === 'error'" class="error-text"
              >✗ 初始化失败，请重试</span
            >
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.init-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: "Inter", sans-serif;
  padding: 2rem;
}

/* 加载动画样式 */
.loading-animation {
  text-align: center;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 已初始化状态样式 */
.initialized-state {
  text-align: center;
  max-width: 500px;
}
.checkmark {
  font-size: 5rem;
  color: #4ade80;
  animation: bounce 1s;
}
@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-top: 2rem;
  overflow: hidden;
}
.progress {
  height: 100%;
  width: 0;
  background: white;
  animation: progress 3s linear forwards;
}
@keyframes progress {
  to {
    width: 100%;
  }
}

/* 初始化表单样式 */
.init-form {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.form-group {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
input {
  width: calc(100% - 1.5rem); /* 修改输入框宽度以匹配按钮 */
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;
}
input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}
button {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  background: white;
  color: #667eea;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
button:disabled {
  background: #4ade80;
  color: white;
  cursor: not-allowed;
}
.success-text {
  animation: pulse 1s infinite;
}
.error-text {
  color: #ef4444;
  animation: shake 0.5s;
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-5px);
  }
  40%,
  80% {
    transform: translateX(5px);
  }
}

/* 美化错误消息样式 */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}
.error-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
  color: #ef4444;
}

/* 彩色动态渐变效果 */
.gradient-text {
  background: linear-gradient(90deg,  #764ba2, #8A2BE2, #9400D3, #4B0082, #0000FF, #00BFFF);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 3s ease-in-out infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
