/**
 * 模块管理器 - 统一管理所有功能模块
 * 提供模块的加载、初始化和生命周期管理
 */
class ModuleManager {
    constructor() {
        this.modules = new Map();
        // 使用全局配置，如果不存在则使用默认值
        const siteConfig = window.SITE_CONFIG || {};
        this.config = {
            analytics: siteConfig.analytics || {
                enabled: true,
                gtagId: 'G-XXXXXXXXXX', // 请替换为您的实际Google Analytics ID
                debug: false
            },
            ads: siteConfig.ads || {
                enabled: false, // 目前禁用广告
                debug: false,
                googleAdsense: {
                    enabled: false,
                    clientId: 'ca-pub-XXXXXXXXXX'
                },
                baiduUnion: {
                    enabled: false,
                    cproid: ''
                }
            }
        };
        
        this.initialized = false;
    }

    /**
     * 加载配置
     */
    loadConfig(customConfig = {}) {
        this.config = this.deepMerge(this.config, customConfig);
        return this;
    }

    /**
     * 深度合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 初始化所有模块
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            console.log('Initializing modules...');

            // 初始化Analytics模块
            if (this.config.analytics.enabled && window.AnalyticsModule) {
                const analytics = new AnalyticsModule(this.config.analytics);
                analytics.init();
                this.modules.set('analytics', analytics);
                console.log('Analytics module initialized');
            }

            // 初始化广告模块
            if (this.config.ads.enabled && window.AdsModule) {
                const ads = new AdsModule(this.config.ads);
                ads.init();
                this.modules.set('ads', ads);
                console.log('Ads module initialized');
            }

            // 绑定页面事件
            this.bindEvents();

            this.initialized = true;
            console.log('All modules initialized successfully');

        } catch (error) {
            console.error('Failed to initialize modules:', error);
        }
    }

    /**
     * 绑定页面事件，用于统计追踪
     */
    bindEvents() {
        const analytics = this.getModule('analytics');
        if (!analytics) return;

        // 页面加载完成
        window.addEventListener('load', () => {
            analytics.trackPageView();
        });

        // 搜索事件追踪
        this.bindSearchEvents(analytics);

        // 下载链接点击追踪
        this.bindDownloadEvents(analytics);

        // 用户交互追踪
        this.bindInteractionEvents(analytics);
    }

    /**
     * 绑定搜索相关事件
     */
    bindSearchEvents(analytics) {
        // 监听搜索表单提交
        const searchForms = ['#searchForm', '#searchInputResults'];
        searchForms.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('input', this.debounce(() => {
                    const searchTerm = element.value.trim();
                    if (searchTerm.length > 2) {
                        analytics.trackInteraction('search_input', 'Search', searchTerm);
                    }
                }, 1000));
            }
        });

        // 监听搜索按钮点击
        const searchButtons = ['#searchBtn', '#searchBtnMain', '#searchBtnResults'];
        searchButtons.forEach(selector => {
            const button = document.querySelector(selector);
            if (button) {
                button.addEventListener('click', () => {
                    const searchInput = document.querySelector('#searchInput') || 
                                      document.querySelector('#searchInputResults');
                    if (searchInput && searchInput.value.trim()) {
                        analytics.trackSearch(searchInput.value.trim());
                    }
                });
            }
        });

        // 监听搜索结果显示
        const resultsDiv = document.querySelector('#resultsDiv');
        if (resultsDiv) {
            const observer = new MutationObserver(() => {
                const results = resultsDiv.querySelectorAll('.result-item');
                if (results.length > 0) {
                    const searchInput = document.querySelector('#searchInput') || 
                                      document.querySelector('#searchInputResults');
                    if (searchInput && searchInput.value.trim()) {
                        analytics.trackSearch(searchInput.value.trim(), results.length);
                    }
                }
            });
            
            observer.observe(resultsDiv, { childList: true, subtree: true });
        }
    }

    /**
     * 绑定下载事件
     */
    bindDownloadEvents(analytics) {
        // 使用事件委托监听所有下载链接
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="pan.baidu.com"], a[href*="pan.quark.cn"], a[href*="drive.google.com"]');
            if (link) {
                const href = link.href;
                let source = 'unknown';
                
                if (href.includes('pan.baidu.com')) source = 'baidu';
                else if (href.includes('pan.quark.cn')) source = 'quark';
                else if (href.includes('drive.google.com')) source = 'google';
                
                // 尝试获取文件名
                const resultItem = link.closest('.result-item');
                let fileName = 'unknown';
                if (resultItem) {
                    const titleElement = resultItem.querySelector('.result-title');
                    if (titleElement) {
                        fileName = titleElement.textContent.trim();
                    }
                }
                
                analytics.trackDownloadClick(fileName, null, source);
            }
        });
    }

    /**
     * 绑定其他交互事件
     */
    bindInteractionEvents(analytics) {
        // 标签页切换
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabType = e.target.getAttribute('data-type');
                analytics.trackInteraction('tab_switch', 'Navigation', tabType);
            }
        });

        // 回到顶部按钮
        const backToTopBtn = document.querySelector('#backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                analytics.trackInteraction('back_to_top', 'Navigation');
            });
        }

        // 手气不错按钮
        const luckyBtn = document.querySelector('#luckyBtn');
        if (luckyBtn) {
            luckyBtn.addEventListener('click', () => {
                analytics.trackInteraction('feeling_lucky', 'Search');
            });
        }

        // Logo点击
        const logoLinks = document.querySelectorAll('#logoLink, #logoLinkResults');
        logoLinks.forEach(logo => {
            logo.addEventListener('click', () => {
                analytics.trackInteraction('logo_click', 'Navigation');
            });
        });
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 获取指定模块
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * 更新模块配置
     */
    updateModuleConfig(moduleName, config) {
        const module = this.modules.get(moduleName);
        if (module && typeof module.updateConfig === 'function') {
            module.updateConfig(config);
        }
    }

    /**
     * 获取所有模块状态
     */
    getModuleStatus() {
        const status = {};
        this.modules.forEach((module, name) => {
            status[name] = {
                initialized: !!module,
                config: module.getConfig ? module.getConfig() : 'No config available'
            };
        });
        return status;
    }

    /**
     * 重新初始化指定模块
     */
    reinitializeModule(moduleName) {
        const module = this.modules.get(moduleName);
        if (module && typeof module.init === 'function') {
            module.init();
        }
    }

    /**
     * 清理所有模块
     */
    cleanup() {
        this.modules.forEach(module => {
            if (typeof module.cleanup === 'function') {
                module.cleanup();
            }
        });
        this.modules.clear();
        this.initialized = false;
    }
}

// 创建全局模块管理器实例
window.moduleManager = new ModuleManager();

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 使用全局站点配置
    if (window.SITE_CONFIG) {
        console.log('Loading site config:', window.SITE_CONFIG);
        window.moduleManager.loadConfig(window.SITE_CONFIG);
    }
    
    // 初始化所有模块
    window.moduleManager.init();
});

// 导出模块管理器
window.ModuleManager = ModuleManager;
