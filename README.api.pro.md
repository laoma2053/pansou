# PanSou API · 高性能聚合网盘搜索引擎（仅后端）

面向精准用户的专业版 README：为希望搭建、集成或私有化部署网盘搜索能力的团队与开发者而写。

- 极速响应：平均 167ms；缓存命中 <100ms
- 高并发：500+ 瞬时并发 100% 成功率；持续并发 QPS≈148
- 异步聚合：慢源不阻塞首屏，后台继续拉满并写回缓存
- 智能结果：去重、权重排序、网盘类型自动归类
- 易于扩展：插件架构 + 统一数据模型，低成本接入更多来源

---

## 1. 产品定位与适配人群

PanSou API 是一个企业级、可私有化部署的聚合搜索后端，聚合 Telegram 频道与多种自定义插件数据源，标准化输出网盘/磁力等链接。

适合：
- 快速搭建网盘搜索网站/服务的个人与团队
- 需要可控、可审计、可横向扩展的企业后端
- 需要 TG + 多数据源聚合的一站式方案
- 注重稳定性、吞吐与可维护性的生产场景

---

## 2. 为什么选择 PanSou API

- 高性能架构：Go 原生并发 + 工作池 +（可选）连接数限制
- 二级缓存：分片内存 LRU + 分片磁盘 GOB 序列化，命中延迟极低
- 异步插件系统：短超时快速返回，后台最长超时继续处理并注入主缓存
- 结果智能化：时间新鲜度 + 关键词优先级 + 插件权重，自动排序与去重
- 类型识别：自动归类阿里云盘、百度、夸克、天翼、UC、移动云、115、PikPak、迅雷、123、磁力、ed2k 等
- 运维友好：健康检查、结构化日志、环境变量全量可配，容器化即用

性能（实测）：
- 500 用户瞬时并发：100% 成功，平均 167ms
- 200 用户持续并发：30s 处理 4725 次请求，QPS≈148
- 缓存命中：99.8% 请求 <100ms

---

## 3. 快速开始（API 后端）

依赖：
- Docker 与 Docker Compose（推荐）

Docker Compose：
1) 下载 compose 文件（纯 API 部署）
   curl -o docker-compose.yml https://raw.githubusercontent.com/fish2018/pansou/main/docker-compose.yml

2) 根据需要修改 environment（如 CHANNELS、ENABLED_PLUGINS 等）

3) 启动
   docker-compose up -d

4) 健康检查
   GET http://<host>:8888/api/health => {"status":"ok"}

Docker 直接运行（示例）：
- docker run -d --name pansou -p 8888:8888 -v pansou-cache:/app/cache -e CHANNELS="tgsearchers3" ghcr.io/fish2018/pansou:latest

---

## 4. API 设计（仅后端）

基础：
- Base URL: http://<host>:<port>/api
- 所有业务响应统一包裹：{ code, message, data }

健康检查：
- GET /api/health
- 返回：
  {
    "status": "ok",
    "plugins_enabled": true,
    "plugin_count": 10,
    "plugins": ["hunhepan", "pansearch", ...],
    "channels": ["tgsearchers3", ...]
  }

搜索接口：
- 支持 GET 与 POST，两者参数含义一致

GET /api/search 参数：
- kw: 字符串，必填，搜索关键词
- channels: 字符串，逗号分隔；当 src=tg 或 all 时生效；为空则用默认配置
- conc: 数字，并发度；不填使用系统默认/自动
- refresh: 布尔（true/false），是否强制跳过缓存
- res: 返回类型，默认 merge；可选：
  - merged_by_type：仅返回按网盘类型聚合的链接
  - results：仅返回原始标准化结果列表
  - all：同时返回 MergedByType 与 Results
  - merge：向后兼容，等价于 merged_by_type
- src: 数据源类型，默认 all；可选：tg | plugin | all
- plugins: 字符串，逗号分隔；当 src=plugin 或 all 时有效；留空表示系统默认（全部）
- ext: JSON 字符串（需 URL 编码），传给插件的扩展字段

GET 示例：
- /api/search?kw=三体&src=all&res=merged_by_type&conc=16
- /api/search?kw=Dune&src=plugin&plugins=hunhepan,pansearch&ext=%7B%22title_en%22%3A%22Dune%22%7D

POST /api/search Body（JSON）：
{
  "kw": "三体",
  "channels": ["tgsearchers3"],
  "conc": 16,
  "refresh": false,
  "res": "merged_by_type",
  "src": "all",
  "plugins": ["hunhepan", "pansearch"],
  "ext": {"title_en": "The Three-Body Problem"}
}

返回结构（data）：
- SearchResponse：
  - Total: 数量（当 res=merged_by_type 时为各类型链接总和）
  - Results: []SearchResult（当 res=results 或 all 时返回）
    - SearchResult: { message_id, unique_id, channel, datetime, title, content, links[], tags[] }
    - Link: { type, url, password }
  - MergedByType: map[string][]MergedLink（当 res=merged_by_type 或 all 时返回）
    - MergedLink: { url, password, note, datetime }

说明：当启用异步插件时，首屏会在短超时内返回可用结果；后台继续补全并写入主缓存，后续相同请求可直接命中。

---

## 5. 配置与调优（环境变量）

核心：
- PORT=8888 服务端口
- CHANNELS=tgsearchers3 默认 TG 频道，逗号分隔
- CONCURRENCY=自动/数值 默认并发（未显式指定时按频道数+插件数+10 估算）
- PROXY=socks5://127.0.0.1:1080（如需访问受限网络）

缓存相关：
- CACHE_ENABLED=true 是否启用缓存
- CACHE_PATH=/app/cache 持久化路径
- CACHE_MAX_SIZE=100 内存缓存上限（MB）
- CACHE_TTL=60 缓存 TTL（分钟）

插件与异步：
- PLUGIN_TIMEOUT=30 单插件超时（秒）
- ASYNC_PLUGIN_ENABLED=true 是否启用异步插件
- ASYNC_RESPONSE_TIMEOUT=4 首屏快速返回超时（秒）
- ASYNC_MAX_BACKGROUND_WORKERS=自动/数值 异步工作者数（默认=CPU×5，至少20）
- ASYNC_MAX_BACKGROUND_TASKS=自动/数值 任务队列容量（默认=工作者×5，至少100）
- ASYNC_CACHE_TTL_HOURS=1 异步缓存 TTL（小时）

HTTP/网络：
- HTTP_READ_TIMEOUT=秒
- HTTP_WRITE_TIMEOUT=秒
- HTTP_IDLE_TIMEOUT=秒
- HTTP_MAX_CONNS=数值 最大连接数（如启用连接限制）

压缩与内存：
- ENABLE_COMPRESSION=false 是否在 API 层压缩（通常交由网关/Nginx）
- MIN_SIZE_TO_COMPRESS=1024 压缩阈值（字节）
- GC_PERCENT=100 Go GC 触发比（建议大内存机器上调）
- OPTIMIZE_MEMORY=true 是否启用内存优化

调优建议：
- conc 建议设为 CPU 核数~2×核数，根据延迟/QPS观测再逐步上调
- CHANNELS 定期维护，确保内容质量与时效
- 生产环境开启持久化缓存目录，提高命中率与冷启动体验

---

## 6. 可扩展性与插件生态

- 统一接口、自动注册：新增插件无需改动主流程
- 异步友好：慢源后台继续抓取并直写主缓存
- 插件开发指南：docs/插件开发指南.md（接口、超时、最佳实践、示例）

---

## 7. 合规与声明

本项目仅提供检索与聚合能力，请在合法合规前提下使用。可通过 res 与类型筛选在调用端实施合规策略。

---

## 8. 支持与参与

- Star & Fork 获取最新更新
- 提交 Issue 反馈问题 / 需求
- 欢迎贡献插件与优化改进
