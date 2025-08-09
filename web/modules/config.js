/**
 * 站点配置文件
 * 集中管理所有模块的配置信息
 */
window.SITE_CONFIG = {
    // 基础站点信息
    site: {
        name: "GugeSo搜索",
        description: "网盘资源搜索引擎",
        keywords: "网盘搜索,资源搜索,百度网盘,夸克网盘",
        author: "GugeSo Team",
        version: "1.0.0"
    },

    // Google Analytics 配置
    analytics: {
        enabled: true,
        gtagId: "G-VYJR6E0BK5", // 您的实际Google Analytics ID
        debug: true, // 启用调试模式，方便检查是否正确加载
        
        // 高级配置
        config: {
            // 隐私保护
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            
            // 自定义维度和指标
            custom_map: {
                // 可以添加自定义维度映射
            },
            
            // 页面加载性能监控
            send_page_view: true,
            page_title: document.title,
            page_location: window.location.href
        }
    },

    // 广告配置 (当前禁用)
    ads: {
        enabled: false, // 当前禁用，需要时设为true
        debug: false,
        
        // Google AdSense 配置
        googleAdsense: {
            enabled: false, // 需要时启用
            clientId: "ca-pub-XXXXXXXXXX", // 请替换为您的Google AdSense发布商ID
            
            // 广告位配置
            slots: {
                searchTop: "XXXXXXXXXX",      // 搜索结果顶部广告位ID
                searchMiddle: "XXXXXXXXXX",   // 搜索结果中间广告位ID
                searchBottom: "XXXXXXXXXX",   // 搜索结果底部广告位ID
                footer: "XXXXXXXXXX"          // 页面底部广告位ID
            },
            
            // 广告格式配置
            formats: {
                searchTop: "horizontal",      // 水平横幅
                searchMiddle: "rectangle",    // 矩形广告
                searchBottom: "horizontal",   // 水平横幅
                footer: "leaderboard"        // 页面横幅
            }
        },
        
        // 百度联盟配置
        baiduUnion: {
            enabled: false, // 需要时启用
            cproid: "XXXXXXXXXX", // 请替换为您的百度联盟ID
            
            // 广告位配置
            slots: {
                searchTop: {
                    id: "XXXXXXXXXX",
                    size: "728x90"
                },
                searchMiddle: {
                    id: "XXXXXXXXXX", 
                    size: "336x280"
                },
                searchBottom: {
                    id: "XXXXXXXXXX",
                    size: "728x90"
                },
                footer: {
                    id: "XXXXXXXXXX",
                    size: "970x250"
                }
            }
        },
        
        // 广告位启用配置
        positions: {
            searchResultsTop: true,    // 搜索结果顶部
            searchResultsMiddle: true, // 搜索结果中间 (第3个结果后)
            searchResultsBottom: true, // 搜索结果底部
            sidebar: false,           // 侧边栏 (桌面端，暂不使用)
            footer: true              // 页面底部
        },
        
        // 广告显示规则
        rules: {
            minResultsForMiddleAd: 5,     // 至少5个搜索结果才显示中间广告
            middleAdPosition: 3,          // 中间广告插入在第3个结果后
            hideOnMobile: false,          // 是否在移动端隐藏广告
            maxAdsPerPage: 3              // 每页最多显示的广告数量
        }
    },

    // 功能模块开关
    features: {
        analytics: true,              // 流量统计
        ads: false,                   // 广告系统
        darkMode: false,              // 深色模式 (未来功能)
        userPreferences: false,       // 用户偏好设置 (未来功能)
        searchHistory: false,         // 搜索历史 (未来功能)
        favorites: false              // 收藏功能 (未来功能)
    },

    // 开发和调试配置
    development: {
        debug: false,                 // 全局调试模式
        logLevel: "info",            // 日志级别: error, warn, info, debug
        mockData: false,             // 是否使用模拟数据
        bypassCache: false           // 是否绕过缓存
    },

    // 性能配置
    performance: {
        lazyLoadAds: true,           // 延迟加载广告
        preloadAnalytics: true,      // 预加载统计脚本
        enableCompression: true,     // 启用压缩
        cacheTimeout: 3600000       // 缓存超时时间 (1小时)
    },

    // 隐私和合规配置
    privacy: {
        showCookieNotice: false,     // 显示Cookie通知 (EU用户)
        enableGDPR: false,          // 启用GDPR合规
        dataRetention: 365,         // 数据保留天数
        analyticsOptOut: false      // 允许用户选择退出统计
    }
};

// 根据环境自动调整配置
(function autoConfig() {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev');
    
    if (isDev) {
        // 开发环境配置
        window.SITE_CONFIG.development.debug = true;
        window.SITE_CONFIG.analytics.debug = true;
        window.SITE_CONFIG.ads.debug = true;
        window.SITE_CONFIG.development.logLevel = "debug";
        console.log("🔧 Development mode enabled");
    }
    
    // 移动端检测
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // 移动端可能需要不同的广告配置
        console.log("📱 Mobile device detected");
    }
})();

// 配置验证函数
window.validateConfig = function() {
    const config = window.SITE_CONFIG;
    const errors = [];
    
    // 检查必要的Analytics配置
    if (config.analytics.enabled && config.analytics.gtagId === "G-XXXXXXXXXX") {
        errors.push("Please set your actual Google Analytics ID in SITE_CONFIG.analytics.gtagId");
    }
    
    // 检查广告配置
    if (config.ads.enabled) {
        if (config.ads.googleAdsense.enabled && config.ads.googleAdsense.clientId === "ca-pub-XXXXXXXXXX") {
            errors.push("Please set your actual AdSense client ID in SITE_CONFIG.ads.googleAdsense.clientId");
        }
        
        if (config.ads.baiduUnion.enabled && config.ads.baiduUnion.cproid === "XXXXXXXXXX") {
            errors.push("Please set your actual Baidu Union ID in SITE_CONFIG.ads.baiduUnion.cproid");
        }
    }
    
    if (errors.length > 0) {
        console.warn("⚠️ Configuration warnings:", errors);
        return false;
    }
    
    console.log("✅ Configuration validation passed");
    return true;
};

// 导出配置更新函数
window.updateSiteConfig = function(newConfig) {
    window.SITE_CONFIG = Object.assign({}, window.SITE_CONFIG, newConfig);
    
    // 重新验证配置
    window.validateConfig();
    
    // 如果模块管理器已初始化，更新其配置
    if (window.moduleManager) {
        window.moduleManager.loadConfig(window.SITE_CONFIG);
    }
};
