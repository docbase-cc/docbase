<template>
    <!-- 搜索结果展示区 -->
    <div v-if="searchResults.length > 0" class="mt-6 space-y-6">
        <div v-for="({ content, paths }, index) of searchResults" :key="index"
            class="bg-white/90 rounded-lg shadow-lg p-6 backdrop-blur-sm">
            <!-- 文件路径展示 -->
            <div class="mb-4">
                <div class="text-gray-600">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="i-carbon-folder text-lg"></i>
                        <span class="text-sm font-medium">文件路径</span>
                        <div class="flex flex-wrap gap-2 pl-6">
                            <span v-for="(path, idx) in paths" :key="idx" 
                                class="inline-flex items-center px-3 py-1.5 rounded-full text-sm
                                bg-gradient-to-r from-blue-50 to-indigo-50 
                                text-gray-700 border border-gray-200/50
                                hover:shadow-sm transition-shadow duration-200">
                                <i class="i-carbon-document text-blue-500 mr-1.5"></i>
                                {{ path }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Markdown内容渲染 -->
            <div class="prose prose-sm max-w-none break-words overflow-hidden max-w-full h-auto">
                <div v-html="micromark(content)" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { micromark } from 'micromark'
import { type SearchResult } from "app/client"

const searchResults = defineModel<SearchResult[]>({ default: [] })
</script>

<style>
.prose {
    @apply text-gray-800;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4 {
    @apply font-semibold text-gray-900 mb-4;
}

.prose p {
    @apply mb-4;
}

.prose code {
    @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono;
    word-break: break-all;
}

.prose pre {
    @apply bg-gray-100 p-4 rounded-lg overflow-x-auto;
}

.prose img {
    @apply max-w-full h-auto object-contain;
}

.prose * {
    max-width: 100%;
}
</style>