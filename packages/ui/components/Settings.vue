<template>
    <div class="settings-container">
        <h2>API 设置</h2>
        <div class="input-group">
            <label for="bearer-token">Bearer Token:</label>
            <input type="password" id="bearer-token" v-model="tokenStore.token" placeholder="请输入您的 Bearer Token" />
        </div>
    </div>
</template>

<script setup lang="ts">
const tokenStore = useTokenStore()
</script>

<style scoped>
.settings-container {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
}

.input-group {
    margin: 20px 0;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
}

input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

input:focus {
    outline: none;
    border-color: #4a9eff;
    box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}
</style>
