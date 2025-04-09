<template>
  <div class="floating-cards">
    <div v-for="plugin in plugins" :key="plugin.name" class="floating-card">
      <div class="card-content">
        <div class="name">
          <p>{{ plugin.name }}</p>
          <!-- 将 pluginType 显示为一个标签 -->
          <span class="plugin-type-label">
            {{
              plugin.pluginType === "DocLoader" ? "文档加载器" : "文档分割器"
            }}
          </span>
        </div>
        <button
          :disabled="plugin.installed || plugin.loading"
          :class="{ installed: plugin.installed }"
          @click="installPlugin(plugin.name)"
        >
          {{
            plugin.loading ? "安装中..." : plugin.installed ? "已安装" : "安装"
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getV0Plugin, putV0Plugin } from "app/client";
import { ofetch } from "ofetch";

const plugins = ref<
  { name: string; pluginType: string; installed: boolean; loading: boolean }[]
>([]);

const installPlugin = async (name: string) => {
  const targetPluginIndex = plugins.value.findIndex((i) => i.name === name);
  if (targetPluginIndex !== -1) {
    plugins.value[targetPluginIndex].loading = true;
  }
  try {
    const { data } = await putV0Plugin({ query: { name: name } });
    console.log(data);
    plugins.value = plugins.value.map((i) =>
      i.name === name ? { ...i, installed: true, loading: false } : i
    );
  } catch (error) {
    console.error("插件安装失败", error);
    if (targetPluginIndex !== -1) {
      plugins.value[targetPluginIndex].loading = false;
    }
  }
};

onMounted(async () => {
  const pluginRes = await getV0Plugin();

  const installedPlugins = [
    pluginRes.data?.docSplitter!,
    ...pluginRes.data?.docLoaders!,
  ]
    .filter((plugin) => plugin.name !== "default")
    .map((plugin) => ({
      ...plugin,
      installed: true,
      loading: false,
    }));

  // 发起网络请求获取指定JSON文件内容
  const jsonData = await ofetch(
    "https://cdn.jsdmirror.com/gh/docbase-cc/plugins/index.json"
  );

  const uninstalledPlugins = jsonData
    .map((i: any) => ({
      ...i,
      installed: false,
      loading: false,
    }))
    .filter(
      (plugin: any) =>
        !installedPlugins.some((i: any) => i.name === plugin.name)
    );

  plugins.value = [...installedPlugins, ...uninstalledPlugins];
});
</script>

<style scoped>
.mt-10 {
  margin-top: 2.5rem; /* 假设 mt-10 对应 2.5rem 的顶部外边距 */
}
.d-flex {
  display: flex;
}
.justify-center {
  justify-content: center;
}
.floating-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

.floating-card {
  width: 220px;
  height: 220px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.25);
  color: white;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.floating-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.card-content {
  padding: 20px;
  text-align: center;
}

.name {
  font-size: 26px;
  margin-bottom: 15px;
}

.name h3 {
  font-weight: 600;
  margin-bottom: 5px;
}

.name p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

/* 新增的标签样式 */
.plugin-type-label {
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 4px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button.installed {
  background-color: #4caf50;
  color: white;
}

button:not(.installed) {
  background-color: white;
  color: #6e8efb;
}

button:not(.installed):hover {
  background-color: #f0f0f0;
}

.id {
  font-size: 14px;
  position: absolute;
  bottom: 10px;
  text-decoration: none; /* 移除下划线 */
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.2); /* 半透明背景 */
  padding: 8px 20px; /* 增加内边距 */
  border-radius: 20px; /* 圆角 */
  width: 120px; /* 固定宽度 */
  text-align: center; /* 文字居中 */
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

.add-knowledge-base-form {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  gap: 10px;
}

.input-field {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.submit-button {
  padding: 10px 20px;
  background-color: #6e8efb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #5a7ded;
}
</style>
