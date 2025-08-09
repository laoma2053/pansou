/**
 * 广告模块 - 为未来的Google AdSense和百度联盟广告做准备
 * 采用原生化设计理念，将广告无缝融入网站设计
 */
class AdsModule {
    constructor(config = {}) {
        this.config = {
            enabled: config.enabled || false,
            debug: config.debug || false,
            googleAdsense: {
                enabled: config.googleAdsense?.enabled || false,
                clientId: config.googleAdsense?.clientId || 'ca-pub-XXXXXXXXXX',
                slots: config.googleAdsense?.slots || {}
            },
            baiduUnion: {
                enabled: config.baiduUnion?.enabled || false,
                cproid: config.baiduUnion?.cproid || '',
                slots: config.baiduUnion?.slots || {}
            },
            positions: {
                searchResultsTop: true,    // 搜索结果顶部
                searchResultsMiddle: true, // 搜索结果中间
                searchResultsBottom: true, // 搜索结果底部
                sidebar: false,           // 侧边栏（桌面端）
                footer: true              // 页面底部
            },
            ...config
        };
        
        this.adContainers = new Map();
        this.initialized = false;
    }

    /**
     * 初始化广告模块
     */
    init() {
        if (!this.config.enabled || this.initialized) {
            return;
        }

        try {
            // 创建广告位容器
            this.createAdContainers();
            
            // 加载广告脚本
            if (this.config.googleAdsense.enabled) {
                this.loadGoogleAdsense();
            }
            
            if (this.config.baiduUnion.enabled) {
                this.loadBaiduUnion();
            }
            
            this.initialized = true;
            
            if (this.config.debug) {
                console.log('Ads module initialized');
            }
        } catch (error) {
            console.error('Failed to initialize ads module:', error);
        }
    }

    /**
     * 创建广告位容器
     */
    createAdContainers() {
        const positions = this.config.positions;
        
        // 搜索结果顶部广告位
        if (positions.searchResultsTop) {
            this.createAdContainer('search-results-top', {
                parent: '#resultsDiv',
                position: 'afterbegin',
                className: 'ad-container ad-search-top',
                placeholder: '搜索结果广告位 - 顶部'
            });
        }
        
        // 搜索结果中间广告位
        if (positions.searchResultsMiddle) {
            this.createAdContainer('search-results-middle', {
                parent: '#listResults',
                position: 'middle', // 特殊处理，在结果中间插入
                className: 'ad-container ad-search-middle',
                placeholder: '搜索结果广告位 - 中间'
            });
        }
        
        // 搜索结果底部广告位
        if (positions.searchResultsBottom) {
            this.createAdContainer('search-results-bottom', {
                parent: '#resultsDiv',
                position: 'beforeend',
                className: 'ad-container ad-search-bottom',
                placeholder: '搜索结果广告位 - 底部'
            });
        }
        
        // 页面底部广告位
        if (positions.footer) {
            this.createAdContainer('footer-ad', {
                parent: '.footer',
                position: 'beforebegin',
                className: 'ad-container ad-footer',
                placeholder: '页面底部广告位'
            });
        }
    }

    /**
     * 创建单个广告容器
     */
    createAdContainer(id, options) {
        const container = document.createElement('div');
        container.id = `ad-${id}`;
        container.className = options.className;
        
        // 如果广告未启用，显示占位符
        if (!this.config.enabled) {
            container.innerHTML = `
                <div class="ad-placeholder">
                    <i class="fas fa-rectangle-ad"></i>
                    <span>${options.placeholder}</span>
                </div>
            `;
            container.style.display = 'none'; // 隐藏占位符
        }
        
        // 插入到指定位置
        const parent = document.querySelector(options.parent);
        if (parent) {
            if (options.position === 'middle') {
                // 特殊处理中间位置
                this.insertMiddleAd(parent, container);
            } else {
                parent.insertAdjacentElement(options.position, container);
            }
            
            this.adContainers.set(id, container);
        }
    }

    /**
     * 在搜索结果中间插入广告
     */
    insertMiddleAd(parent, adContainer) {
        // 监听搜索结果更新
        const observer = new MutationObserver(() => {
            const results = parent.querySelectorAll('.result-item');
            if (results.length >= 3) {
                // 在第3个结果后插入广告
                const targetIndex = Math.min(2, Math.floor(results.length / 2));
                const targetResult = results[targetIndex];
                
                if (targetResult && !parent.contains(adContainer)) {
                    targetResult.insertAdjacentElement('afterend', adContainer);
                }
            }
        });
        
        observer.observe(parent, { childList: true });
    }

    /**
     * 加载Google AdSense
     */
    loadGoogleAdsense() {
        if (window.adsbygoogle) {
            return; // 已加载
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.setAttribute('data-ad-client', this.config.googleAdsense.clientId);
        document.head.appendChild(script);

        // 初始化adsbygoogle数组
        window.adsbygoogle = window.adsbygoogle || [];
    }

    /**
     * 加载百度联盟
     */
    loadBaiduUnion() {
        // 百度联盟脚本加载逻辑
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://cbjs.baidu.com/js/m.js';
        document.head.appendChild(script);
    }

    /**
     * 显示Google AdSense广告
     */
    showGoogleAd(containerId, slotId, format = 'auto') {
        const container = this.adContainers.get(containerId);
        if (!container || !this.config.googleAdsense.enabled) {
            return;
        }

        const adElement = document.createElement('ins');
        adElement.className = 'adsbygoogle';
        adElement.style.display = 'block';
        adElement.setAttribute('data-ad-client', this.config.googleAdsense.clientId);
        adElement.setAttribute('data-ad-slot', slotId);
        adElement.setAttribute('data-ad-format', format);

        container.innerHTML = '';
        container.appendChild(adElement);

        // 推送到AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    }

    /**
     * 显示百度联盟广告
     */
    showBaiduAd(containerId, config) {
        const container = this.adContainers.get(containerId);
        if (!container || !this.config.baiduUnion.enabled) {
            return;
        }

        // 百度联盟广告代码
        const adHtml = `
            <script type="text/javascript">
                /*${config.size}*/
                var cpro_id = "${this.config.baiduUnion.cproid}";
            </script>
            <script type="text/javascript" src="https://cpro.baidustatic.com/cpro/ui/c.js"></script>
        `;

        container.innerHTML = adHtml;
    }

    /**
     * 隐藏所有广告
     */
    hideAllAds() {
        this.adContainers.forEach(container => {
            container.style.display = 'none';
        });
    }

    /**
     * 显示所有广告
     */
    showAllAds() {
        this.adContainers.forEach(container => {
            container.style.display = 'block';
        });
    }

    /**
     * 刷新广告
     */
    refreshAds() {
        if (this.config.googleAdsense.enabled && window.adsbygoogle) {
            // Google AdSense刷新逻辑
            this.adContainers.forEach((container, id) => {
                const adElement = container.querySelector('.adsbygoogle');
                if (adElement) {
                    // 刷新广告
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            });
        }
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * 获取广告位信息
     */
    getAdContainers() {
        return Array.from(this.adContainers.entries()).map(([id, element]) => ({
            id,
            element,
            visible: element.style.display !== 'none'
        }));
    }
}

// 导出模块
window.AdsModule = AdsModule;
