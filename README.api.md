
<div align="center">

# 🚀 PanSou API

### 新一代高性能网盘资源聚合搜索引擎

**毫秒级响应 · 异步架构 · 无限扩展**

[![Go Version](https://img.shields.io/github/go-mod/go-version/fish2018/pansou?style=flat-square&logo=go)](https://go.dev/)
[![Docker Pulls](https://img.shields.io/docker/pulls/fish2018/pansou?style=flat-square&logo=docker)](https://hub.docker.com/r/fish2018/pansou)
[![License](https://img.shields.io/github/license/fish2018/pansou?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/fish2018/pansou?style=flat-square)](https://github.com/fish2018/pansou/stargazers)

[快速开始](#-快速开始) · [核心特性](#-为什么选择-pansou) · [API 文档](#-api-接口) · [性能测试](#-性能表现) · [插件开发](docs/插件开发指南.md)

</div>

---

## 📖 项目简介

**PanSou** 是一个专为开发者打造的企业级网盘资源聚合搜索 API 服务。基于 Go 语言开发，采用创新的异步插件架构和二级缓存系统，为您的应用提供极速、稳定、可扩展的搜索能力。

### 适用场景

- 🎯 **构建网盘搜索网站/应用** - 提供完整的后端 API 支持
- 🔧 **私有化部署搜索引擎** - 掌控数据，保护隐私
- 🌐 **企业资源管理系统** - 统一管理多平台网盘资源
- 📱 **移动端应用开发** - RESTful API，跨平台友好
- 🤖 **机器人/自动化工具** - 提供程序化搜索能力

## 🚀 核心亮点：为什么选择 PanSou API？

我们深知，对于一个现代化的搜索服务，速度、准确性和扩展性是成功的关键。PanSou 在架构设计的每一个环节都将这些要素发挥到极致。

### 1. 极致性能：专为高并发设计
基于 Go 语言的原生性能优势，我们通过精巧的并发模型与内存管理，实现了惊人的处理能力。

- **高并发处理**: 经实测，在标准云服务器上可轻松应对 **500+ 瞬时并发**，请求成功率 100%，平均响应时间仅 **167ms**。
- **高吞吐量 (QPS)**: 在持续并发场景下，QPS（每秒请求数）稳定在 **148+**。
- **智能二级缓存**: 独创的 **分片内存 (LRU) + 分片磁盘 (GOB)** 缓存系统，使重复搜索的响应时间缩短至 **<100ms**，命中率高达 **99.8%**。

### 2. 革命性异步插件架构：告别漫长等待
传统聚合搜索最大的痛点是等待最慢的那个数据源。PanSou 的异步插件架构彻底解决了这个问题。

- **“先响应，后聚合”**: 系统会在极短时间内（可配置，如2秒）返回已获取的结果，同时在后台继续执行慢速插件的搜索任务，并将最终结果异步更新至缓存。用户无需等待，即可获得初步结果。
- **双重超时机制**: 插件分为快速响应（默认4秒）和后台长时（默认30秒）两个阶段，确保系统稳定性和数据完整性的完美平衡。
- **高度可扩展**: 只需实现一个简单的接口，您就可以轻松编写自己的插件，接入任何网站、API 或其他数据源。详情请参阅 [**《插件开发指南》**](docs/插件开发指南.md)。

### 3. 智能结果处理：信息不再杂乱无章
从海量数据中精准提取并呈现有效信息，是 PanSou 的核心能力之一。

- **多维度智能排序**: 综合考虑 **时间新鲜度、插件权重、关键词匹配度** 等因素，自动将最相关的结果排在最前。
- **网盘类型自动归类**: 自动识别并分类 **12种以上** 的网盘链接（如阿里云盘、百度网盘、夸克、115等）和磁力链接，方便前端筛选和展示。
- **结果自动去重**: 智能合并来自不同数据源的重复结果，确保最终输出的列表干净、清爽。

### 4. 部署与运维：极致简化
我们推崇 “开箱即用” 的理念，通过 Docker 将复杂的环境配置和依赖问题彻底封装。

- **一键启动**: 仅需一条 `docker` 命令，即可在任何支持 Docker 的环境中启动 PanSou API 服务。
- **环境变量配置**: 提供丰富的环境变量，从基础端口到核心性能参数（如并发数、缓存大小、GC策略），均可灵活配置，以适应从个人NAS到高性能服务器的各种部署环境。
- **健康检查**: 内置 `/api/health` 健康检查端点，可与 Docker、Kubernetes 等容器编排工具无缝集成，实现服务异常时的自动重启。

## 🛠️ 快速开始

### 环境要求
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/) (推荐)

### 使用 Docker Compose (推荐)
这是最推荐的部署方式，配置文件结构清晰，易于管理。

1.  **下载 `docker-compose.yml` 文件。**
    ```bash
    # 对于纯API部署
    curl -o docker-compose.yml https://raw.githubusercontent.com/fish2018/pansou/main/docker-compose.yml
    ```

2.  **按需修改配置。**
    打开 `docker-compose.yml`，根据您的需求修改 `environment` 部分的配置，例如 `CHANNELS` (Telegram频道) 和 `ENABLED_PLUGINS` (启用的插件)。

3.  **启动服务。**
    ```bash
    docker-compose up -d
    ```

4.  **验证服务。**
    访问 `http://<您的服务器IP>:8888/api/health`，如果返回 `{"status": "ok"}`，则表示服务已成功启动。

### API 使用示例

服务启动后，您可以通过以下方式调用搜索 API：

```
GET /api/search?keyword=你的关键词&cloud_types=aliyun,quark
```

- `keyword`: 必填，您要搜索的关键词。
- `source`: 可选，指定搜索源 (`tg`, `plugin`, `all`)，默认为 `all`。
- `cloud_types`: 可选，按网盘类型筛选结果，多个用逗号分隔。

一个成功的响应会是这样的：
```json
{
    "code": 200,
    "message": "Success",
    "isFinal": true,
    "data": [
        {
            "title": "《三体》全集 4K典藏版",
            "url": "https://pan.aliyun.com/s/xxxx",
            "source": "某插件",
            "size": "50.2 GB",
            "date": "2024-10-28",
            "cloud_type": "aliyun"
        }
    ]
}
```
- `isFinal`: `false` 表示这是快速响应的部分结果，后台仍在继续搜索。

## ⚙️ 高级配置

您可以通过环境变量对 PanSou 进行深度定制和性能调优。

| 环境变量 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `PORT` | API 服务监听端口 | `8888` |
| `ENABLED_PLUGINS` | 启用的插件列表，逗号分隔 | `all` |
| `CHANNELS` | 搜索的 Telegram 频道ID，逗号分隔 | `tgsearchers3` |
| `ASYNC_RESPONSE_TIMEOUT` | 异步插件快速响应的超时时间（秒） | `4` |
| `PLUGIN_TIMEOUT` | 插件执行的总超时时间（秒） | `30` |
| `CACHE_TTL` | 缓存有效期（分钟） | `60` |
| `CACHE_MAX_SIZE` | 内存缓存的最大大小（MB） | `100` |
| `SHARD_COUNT` | 缓存分片数量，建议与CPU核心数一致 | `8` |
| `PROXY` | SOCKS5 代理，用于访问特殊网络 | 无 |

---

我们相信，PanSou API 将成为您构建下一代搜索应用的坚实基础。欢迎 [Fork 本项目](https://github.com/fish2018/pansou/fork) 并给我们点亮一颗 Star！如果您有任何问题或建议，欢迎随时提交 Issue。
