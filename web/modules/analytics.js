/**
 * Google Analytics 模块
 * 用于网站流量统计和分析
 */
class AnalyticsModule {
    constructor(config = {}) {
        this.config = {
            gtagId: config.gtagId || 'G-XXXXXXXXXX', // 请替换为您的实际Google Analytics ID
            enabled: config.enabled !== false,
            debug: config.debug || false,
            ...config
        };
        
        this.initialized = false;
    }

    /**
     * 初始化Google Analytics
     */
    init() {
        if (!this.config.enabled || this.initialized) {
            return;
        }

        try {
            // 加载Google Analytics脚本
            this.loadGtagScript();
            
            // 初始化gtag
            this.initGtag();
            
            this.initialized = true;
            
            if (this.config.debug) {
                console.log('Google Analytics initialized with ID:', this.config.gtagId);
            }
        } catch (error) {
            console.error('Failed to initialize Google Analytics:', error);
        }
    }

    /**
     * 加载Google Analytics脚本
     */
    loadGtagScript() {
        // 创建并插入gtag脚本
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gtagId}`;
        document.head.appendChild(script);

        // 创建gtag函数
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
    }

    /**
     * 初始化gtag配置
     */
    initGtag() {
        gtag('js', new Date());
        gtag('config', this.config.gtagId, {
            // 基础配置
            page_title: document.title,
            page_location: window.location.href,
            
            // 隐私保护配置
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
    }

    /**
     * 跟踪页面浏览
     */
    trackPageView(page_path = null, page_title = null) {
        if (!this.initialized || !window.gtag) {
            return;
        }

        const params = {};
        if (page_path) params.page_path = page_path;
        if (page_title) params.page_title = page_title;

        gtag('config', this.config.gtagId, params);

        if (this.config.debug) {
            console.log('Page view tracked:', params);
        }
    }

    /**
     * 跟踪搜索事件
     */
    trackSearch(searchTerm, resultCount = null) {
        if (!this.initialized || !window.gtag) {
            return;
        }

        const eventData = {
            event_category: 'Search',
            event_label: searchTerm
        };

        if (resultCount !== null) {
            eventData.custom_parameters = {
                result_count: resultCount
            };
        }

        gtag('event', 'search', eventData);

        if (this.config.debug) {
            console.log('Search event tracked:', searchTerm, resultCount);
        }
    }

    /**
     * 跟踪文件下载点击
     */
    trackDownloadClick(fileName, fileSize = null, source = null) {
        if (!this.initialized || !window.gtag) {
            return;
        }

        const eventData = {
            event_category: 'Download',
            event_label: fileName
        };

        if (fileSize) eventData.file_size = fileSize;
        if (source) eventData.source = source;

        gtag('event', 'file_download', eventData);

        if (this.config.debug) {
            console.log('Download click tracked:', fileName);
        }
    }

    /**
     * 跟踪用户互动事件
     */
    trackInteraction(action, category = 'User Interaction', label = null) {
        if (!this.initialized || !window.gtag) {
            return;
        }

        const eventData = {
            event_category: category
        };

        if (label) eventData.event_label = label;

        gtag('event', action, eventData);

        if (this.config.debug) {
            console.log('Interaction tracked:', action, category, label);
        }
    }

    /**
     * 设置用户属性
     */
    setUserProperty(propertyName, value) {
        if (!this.initialized || !window.gtag) {
            return;
        }

        gtag('config', this.config.gtagId, {
            custom_map: {
                [propertyName]: value
            }
        });
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
}

// 导出模块
window.AnalyticsModule = AnalyticsModule;
