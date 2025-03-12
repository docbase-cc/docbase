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

- 📂 全能文档支持：一站式继承，Markdown/Office 等格式全覆盖
- 🧩 灵活插件系统：模块化设计，随心扩展文档类型支持
- ☁️ 云端管理方案：支持 WebDAV，打造专业云端知识仓库
- 🚀 智能实时同步：自动监测文件更新知识库，再也无须手动维护
- 🔌 生态互联互通：可作为 Dify 外部知识库，扩展无限可能
- 🔍 三重搜索引擎：MeiliSearch 驱动，全文、模糊、向量检索无死角
- 🐳 极简部署方案：Docker 私有部署，一键启动，数据安全，省心省力

## 🚀 快速开始

### 使用 Docker Compose

1. 下载 Docker Compose 文件：

```bash
curl -o docker-compose.yaml https://unpkg.com/docbase/docker-compose.yaml
```

2. 修改`docker-compose.yaml`中以下环境变量

- MEILI_MASTER_KEY 设置 DocBase 应用密钥
- EMBEDDING_APIKEY 嵌入模型服务（默认为硅基流动）密钥

3. 启动服务

```bash
docker-compose up -d
```

### 下载安装客户端

<!-- 客户端版（插件、多模态重构结束后才会做） -->
<!-- 动态选择知识库目录功能 -->
<!-- 本地自动部署 meilisearch -->
<!-- 整合 aiaw 前端 -->
<!-- 制作图文发小红书 -->

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
<!-- TODO 制作宣传视频发 bilibili -->

<!-- 工程化 -->
<!-- TODO 单元测试 -->
<!-- TODO 打点日志 -->

<!-- 功能 -->
<!-- TODO 插件管理 API -->
<!-- TODO 插件变动重新触发扫描 -->
<!-- TODO 客户端版 -->
<!-- TODO 文件加载器、分割器支持自定义向量 -->
<!-- TODO 前端 i8n -->

<!-- 企业版 -->
<!-- 多知识库管理 -->
<!-- 知识库粒度的权限管理（webdav权限+搜索权限控制） -->
<!-- 文件时光旅行功能，记录修改记录 -->
<!-- 知识库分享、挂载 -->
<!-- OIDC 认证 -->
