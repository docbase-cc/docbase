<div align="center">
  <h1>🗃️ DocBase</h1>
  <p><strong>为AI构建的私有实时知识库</strong></p>
  <p>轻松构建 · 自动管理 · 极速搜索</p>
</div>

<p align="center">
  <a href="https://docbase.cc">Website</a> •
  <a href="./README.en.md">English</a>
</p>

---

## ✨ 特性

- 📂 全能文档支持：一站式集成，Markdown/Office 等格式全覆盖
- 🧩 灵活插件系统：模块化设计，随心扩展文档类型支持
- ☁️ 云端管理方案：支持 WebDAV，打造专业云端知识仓库
- 🚀 智能实时同步：自动监测文件更新知识库，再也无须手动维护
- 🔌 生态互联互通：可作为 Dify 外部知识库，扩展无限可能
- 🔍 三重搜索引擎：MeiliSearch 驱动，全文、模糊、向量检索无死角
- 🐳 极简部署方案：多平台安装包一键启动，数据安全，省心省力

## 🚀 快速开始

### 安装包启动

下载最新安装包：https://github.com/docbase-cc/docbase/releases

- unix(macos & linux): `chmod +x docbase dufs schema-engine-* && ./docbase`
- windows: `.\docbase.exe`

### 使用 Docker

```
docker run -d -p 3000:3000 -v ./data:/app/.docbase gonorth/docbase:latest
```

### 使用 Docker Compose

1. 下载 Docker Compose 文件：

```bash
curl -L -o docker-compose.yaml https://unpkg.com/docbase/dist/docker-compose.yaml
```

2. 启动服务

```bash
docker-compose up -d
```

密钥默认为：mykey

生产环境请修改`docker-compose.yaml`中以下环境变量

- MEILI_MASTER_KEY: DocBase 的应用密钥

## 🤝 贡献

我们欢迎所有形式的贡献，无论是新功能、文档改进还是 bug 修复。

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 [GAPLv3](LICENSE) 许可证。如需许可证外其他用途，请联系 Wechat SOVLOOKUP。

<!-- 下一步-->

<!-- TODO 前端界面 -->
<!-- TODO [图编辑实现] 模型管理 -->
<!-- TODO [图编辑实现] 知识库配置模型 -->
<!-- TODO [图编辑实现] 拓展配置插件 -->

<!-- 客户端版 -->
<!-- 本地自动部署 meilisearch -->
<!-- 制作宣传视频发 bilibili -->
<!-- 制作图文发小红书 -->

<!-- TODO 插件 -->
<!-- TODO [插件] 探索更精准的 RAG 考虑支持图谱 -->
<!-- TODO [插件] 中间件插件（search、upsert、remove 操作可使用中间件拓展） -->
<!-- TODO [插件] 合集插件（多个插件为一个插件单元统一安装卸载） -->
<!-- TODO [插件] 插件更统一，将底层 API 给插件用，从而支持更丰富的文档处理逻辑 -->
<!-- TODO [文档] 文档补充插件开发教程 -->

<!-- 企业版 -->
<!-- Docker -->
<!-- 知识库自定义 dify 搜索的配置 -->
<!-- 文件时光旅行功能，记录修改记录 -->
<!-- 多用户 -->
<!-- OIDC 认证 -->
<!-- 知识库粒度的权限管理（webdav权限+搜索权限控制） -->
<!-- 知识库分享、挂载 -->
<!-- 前端 i8n -->
