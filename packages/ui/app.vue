<template>
  <div
    class="init-container"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Settings />
  </div>
</template>

<style>
.init-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: "Inter", sans-serif;
  padding: 2rem;
}
</style>
