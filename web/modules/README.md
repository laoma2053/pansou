# GugeSo 模块系统

## 快速开始

### 1. 设置 Google Analytics

在浏览器控制台运行：

```javascript
// 替换为您的真实 Google Analytics ID
quickSetup.setAnalyticsId('G-YOUR_ACTUAL_ID');
quickSetup.validate();
```

### 2. 测试配置

访问 `test-modules.html` 页面检查所有模块是否正常工作。

### 3. 查看统计数据

部署后访问 [Google Analytics](https://analytics.google.com/) 查看实时统计数据。

## 文件说明

- `modules/config.js` - 站点配置文件，所有设置都在这里
- `modules/analytics.js` - Google Analytics 模块
- `modules/ads.js` - 广告模块（当前禁用）
- `modules/ads.css` - 广告样式
- `modules/module-manager.js` - 模块管理器
- `modules/quick-setup.js` - 快速设置工具
- `test-modules.html` - 模块测试页面

## 当前状态

✅ Google Analytics 流量统计 - 已启用，需配置真实ID  
⏸️ Google AdSense 广告 - 已准备，当前禁用  
⏸️ 百度联盟广告 - 已准备，当前禁用  

## 需要配置的内容

1. **Google Analytics ID**: 在 `config.js` 中将 `G-XXXXXXXXXX` 替换为您的真实ID
2. **广告账户信息**: 未来启用广告时需要配置相应的账户ID

详细说明请查看 `docs/流量统计与广告模块使用指南.md`。
