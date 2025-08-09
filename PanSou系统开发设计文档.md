# PanSou 网盘搜索系统开发设计文档

## 📋 文档目录

- [1. 项目概述](#1-项目概述)
- [2. 系统架构设计](#2-系统架构设计)
- [3. 异步插件系统](#3-异步插件系统)
- [4. 二级缓存系统](#4-二级缓存系统)  
- [5. 核心组件实现](#5-核心组件实现)
- [6. API接口设计](#6-api接口设计)
- [7. 插件开发框架](#7-插件开发框架)
- [8. 性能优化实现](#8-性能优化实现)
- [9. 技术选型说明](#9-技术选型说明)

---

## 1. 项目概述

### 1.1 项目定位

PanSou是一个高性能的网盘资源搜索API服务，支持TG搜索和自定义插件搜索。系统采用异步插件架构，具备二级缓存机制和并发控制能力，在MacBook Pro 8GB上能够支持500用户并发访问。

### 1.2 性能表现（实测数据）

- ✅ **500用户瞬时并发**: 100%成功率，平均响应167ms
- ✅ **200用户持续并发**: 30秒内处理4725请求，QPS=148
- ✅ **缓存命中**: 99.8%请求<100ms响应时间  
- ✅ **高可用性**: 长时间运行无故障

### 1.3 核心特性

- **异步插件系统**: 双级超时控制（4秒/30秒），渐进式结果返回
- **二级缓存系统**: 分片内存缓存+分片磁盘缓存，GOB序列化
- **工作池管理**: 基于`util/pool`的并发控制
- **智能结果合并**: `mergeSearchResults`函数实现去重合并
- **多网盘类型支持**: 自动识别12种网盘类型

---

## 2. 系统架构设计

### 2.1 整体架构流程

```mermaid
graph TB
    A[用户请求] --> B{API网关<br/>中间件}
    B --> C[参数解析<br/>与验证]
    C --> D[搜索服务<br/>SearchService]
    
    D --> E{数据来源<br/>选择}
    E -->|TG| F[Telegram搜索]
    E -->|Plugin| G[插件搜索]
    E -->|All| H[并发搜索]
    
    H --> F
    H --> G
    
    F --> I[TG频道搜索]
    I --> J[HTML解析]
    J --> K[链接提取]
    K --> L[结果标准化]
    
    G --> M[插件管理器<br/>PluginManager]
    M --> N[异步插件调度]
    N --> O[插件工作池]
    O --> P[HTTP客户端]
    P --> Q[目标网站API]
    Q --> R[响应解析]
    R --> S[结果过滤]
    
    L --> T{二级缓存系统}
    S --> T
    
    T --> U[分片内存缓存<br/>LRU + 原子操作]
    T --> V[分片磁盘缓存<br/>GOB序列化]
    
    U --> W[缓存检查]
    V --> W
    W --> X{缓存命中?}
    
    X -->|是| Y[缓存反序列化]
    X -->|否| Z[执行搜索]
    
    Z --> AA[异步更新缓存]
    AA --> U
    AA --> V
    
    Y --> BB[结果合并<br/>mergeSearchResults]
    AA --> BB
    
    BB --> CC[网盘类型分类]
    CC --> DD[智能排序<br/>时间+权重]
    DD --> EE[结果过滤<br/>cloud_types]
    EE --> FF[JSON响应]
    FF --> GG[用户]
    
    %% 异步处理流程
    N --> HH[短超时处理<br/>4秒]
    HH --> II{是否完成?}
    II -->|是| JJ[返回完整结果<br/>isFinal=true]
    II -->|否| KK[返回部分结果<br/>isFinal=false]
    
    KK --> LL[后台继续处理<br/>最长30秒]
    LL --> MM[完整结果获取]
    MM --> NN[主缓存更新]
    NN --> U
    
    %% 样式定义
    classDef cacheNode fill:#e1f5fe
    classDef pluginNode fill:#f3e5f5
    classDef searchNode fill:#e8f5e8
    classDef asyncNode fill:#fff3e0
    
    class T,U,V,W,X,Y,AA cacheNode
    class M,N,O,P,G pluginNode
    class F,I,J,K,L searchNode
    class HH,II,JJ,KK,LL,MM,NN asyncNode
```

### 2.2 异步插件工作流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant API as API Gateway
    participant S as SearchService  
    participant PM as PluginManager
    participant P as AsyncPlugin
    participant WP as WorkerPool
    participant C as Cache
    participant EXT as 外部API

    U->>API: 搜索请求 (kw=关键词)
    API->>S: 处理搜索
    S->>C: 检查缓存
    
    alt 缓存命中
        C-->>S: 返回缓存数据 (<100ms)
        S-->>U: 返回结果
    else 缓存未命中
        S->>PM: 调度插件搜索
        PM->>P: 设置关键词和缓存键
        P->>WP: 提交异步任务
        
        par 短超时处理 (4秒)
            WP->>EXT: HTTP请求
            EXT-->>WP: 响应数据
            WP->>P: 解析结果
            P-->>S: 部分结果 (isFinal=false)
            S->>C: 缓存部分结果
            S-->>U: 快速响应
        and 后台完整处理 (最长30秒)
            WP->>EXT: 继续处理
            EXT-->>WP: 完整数据
            WP->>P: 完整结果
            P->>S: 最终结果 (isFinal=true)
            S->>C: 更新主缓存
            Note over C: 用户下次请求将获得完整结果
        end
    end
```

### 2.3 核心组件

#### 2.3.1 HTTP服务层 (`api/`)
- **router.go**: 路由配置
- **handler.go**: 请求处理逻辑
- **middleware.go**: 中间件（日志、CORS等）

#### 2.3.2 搜索服务层 (`service/`)
- **search_service.go**: 核心搜索逻辑，结果合并

#### 2.3.3 插件系统层 (`plugin/`)
- **plugin.go**: 插件接口定义
- **baseasyncplugin.go**: 异步插件基类
- **各插件目录**: jikepan、pan666、hunhepan等

#### 2.3.4 工具层 (`util/`)
- **cache/**: 二级缓存系统实现
- **pool/**: 工作池实现
- **其他工具**: HTTP客户端、解析工具等

---

## 3. 异步插件系统

### 3.1 设计理念

异步插件系统解决传统同步搜索响应慢的问题，采用"尽快响应，持续处理"策略：
- **4秒短超时**: 快速返回部分结果（`isFinal=false`）
- **30秒长超时**: 后台继续处理，获得完整结果（`isFinal=true`）
- **主动缓存更新**: 完整结果自动更新主缓存，下次访问更快

### 3.2 插件接口实现

基于`plugin/plugin.go`的实际接口：

```go
type AsyncSearchPlugin interface {
    Name() string
    Priority() int
    
    AsyncSearch(keyword string, searchFunc func(*http.Client, string, map[string]interface{}) ([]model.SearchResult, error), 
               mainCacheKey string, ext map[string]interface{}) ([]model.SearchResult, error)
    
    SetMainCacheKey(key string)
    SetCurrentKeyword(keyword string)
    Search(keyword string, ext map[string]interface{}) ([]model.Sea