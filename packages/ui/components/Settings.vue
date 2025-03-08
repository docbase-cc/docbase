<template>
    <div class="settings-card">
        <h2 class="settings-title">设置</h2>
        <div class="input-group">
            <label for="bearer-token">API 密钥</label>
            <div class="input-wrapper">
                <input type="password" id="bearer-token" v-model="tokenStore.token" placeholder="请输入您的 Bearer Token" />
                <div class="input-border"></div>
            </div>
            <p class="input-hint">请妥善保管您的密钥，不要泄露给他人</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const tokenStore = useTokenStore()
</script>

<style scoped>
.settings-card {
    background: white;
    border-radius: 12px;
    padding: 30px;
    width: 100%;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.settings-title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 30px;
}

.input-group {
    margin: 24px 0;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
    font-size: 15px;
}

.input-wrapper {
    position: relative;
    margin-bottom: 4px;
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

.input-hint {
    font-size: 13px;
    color: #6b7280;
    margin-top: 6px;
}
</style>
