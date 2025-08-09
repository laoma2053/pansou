/**
 * 快速设置脚本
 * 用于快速配置 Google Analytics ID 和其他设置
 */

// 在浏览器控制台运行以下函数来快速配置

window.quickSetup = {
    
    /**
     * 设置 Google Analytics ID
     * @param {string} gtagId - Google Analytics Measurement ID (格式: G-XXXXXXXXXX)
     */
    setAnalyticsId: function(gtagId) {
        if (!gtagId || !gtagId.startsWith('G-')) {
            console.error('❌ 无效的 Google Analytics ID。格式应为: G-XXXXXXXXXX');
            return false;
        }
        
        if (window.SITE_CONFIG) {
            window.SITE_CONFIG.analytics.gtagId = gtagId;
            console.log(`✅ Google Analytics ID 已设置为: ${gtagId}`);
            
            // 重新初始化 Analytics
            if (window.moduleManager) {
                window.moduleManager.updateModuleConfig('analytics', {
                    gtagId: gtagId
                });
                console.log('🔄 Analytics 模块配置已更新');
            }
            
            return true;
        } else {
            console.error('❌ 配置文件未加载');
            return false;
        }
    },
    
    /**
     * 启用调试模式
     */
    enableDebug: function() {
        if (window.SITE_CONFIG) {
            window.SITE_CONFIG.development.debug = true;
            window.SITE_CONFIG.analytics.debug = true;
            window.SITE_CONFIG.ads.debug = true;
            console.log('🔧 调试模式已启用');
            return true;
        }
        return false;
    },
    
    /**
     * 禁用调试模式
     */
    disableDebug: function() {
        if (window.SITE_CONFIG) {
            window.SITE_CONFIG.development.debug = false;
            window.SITE_CONFIG.analytics.debug = false;
            window.SITE_CONFIG.ads.debug = false;
            console.log('🔒 调试模式已禁用');
            return true;
        }
        return false;
    },
    
    /**
     * 启用广告模块 (仅用于测试)
     */
    enableAds: function() {
        if (window.SITE_CONFIG) {
            window.SITE_CONFIG.ads.enabled = true;
            console.log('📢 广告模块已启用');
            console.warn('⚠️ 请确保已正确配置广告账户信息');
            return true;
        }
        return false;
    },
    
    /**
     * 禁用广告模块
     */
    disableAds: function() {
        if (window.SITE_CONFIG) {
            window.SITE_CONFIG.ads.enabled = false;
            console.log('🚫 广告模块已禁用');
            return true;
        }
        return false;
    },
    
    /**
     * 设置 Google AdSense 客户端 ID
     */
    setAdSenseId: function(clientId) {
        if (!clientId || !clientId.startsWith('ca-pub-')) {
            console.error('❌ 无效的 AdSense 客户端 ID。格式应为: ca-pub-XXXXXXXXXX');
            return false;
        }
        
        if (window.SITE_CONFIG) {
            window.SITE_CONFIG.ads.googleAdsense.clientId = clientId;
            console.log(`✅ AdSense 客户端 ID 已设置为: ${clientId}`);
            return true;
        }
        return false;
    },
    
    /**
     * 显示当前配置
     */
    showConfig: function() {
        if (window.SITE_CONFIG) {
            console.log('📋 当前配置:');
            console.log('Analytics:', {
                enabled: window.SITE_CONFIG.analytics.enabled,
                gtagId: window.SITE_CONFIG.analytics.gtagId,
                debug: window.SITE_CONFIG.analytics.debug
            });
            console.log('Ads:', {
                enabled: window.SITE_CONFIG.ads.enabled,
                googleAdsense: window.SITE_CONFIG.ads.googleAdsense.enabled,
                baiduUnion: window.SITE_CONFIG.ads.baiduUnion.enabled
            });
            console.log('Debug Mode:', window.SITE_CONFIG.development.debug);
            return window.SITE_CONFIG;
        }
        return null;
    },
    
    /**
     * 验证当前配置
     */
    validate: function() {
        if (window.validateConfig) {
            console.log('🔍 验证配置...');
            const isValid = window.validateConfig();
            
            if (isValid) {
                console.log('✅ 配置验证通过');
            } else {
                console.log('⚠️ 配置有问题，请检查上方的警告信息');
            }
            
            return isValid;
        } else {
            console.error('❌ 验证函数不可用');
            return false;
        }
    },
    
    /**
     * 显示帮助信息
     */
    help: function() {
        console.log(`
🛠️ GugeSo 快速设置工具

常用命令:
- quickSetup.setAnalyticsId('G-YOUR_ID')     设置 Google Analytics ID
- quickSetup.enableDebug()                   启用调试模式
- quickSetup.disableDebug()                  禁用调试模式
- quickSetup.showConfig()                    显示当前配置
- quickSetup.validate()                      验证配置
- quickSetup.enableAds()                     启用广告模块
- quickSetup.disableAds()                    禁用广告模块
- quickSetup.setAdSenseId('ca-pub-XXX')      设置 AdSense ID

示例设置流程:
1. quickSetup.setAnalyticsId('G-1234567890')  # 设置您的真实 Analytics ID
2. quickSetup.validate()                      # 验证配置
3. quickSetup.showConfig()                    # 查看配置

注意: 设置后请刷新页面使配置生效
        `);
    }
};

// 自动运行帮助
if (typeof window !== 'undefined') {
    console.log('🚀 GugeSo 快速设置工具已加载');
    console.log('💡 在控制台输入 quickSetup.help() 查看使用说明');
    
    // 检查是否为开发环境
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.includes('dev');
    
    if (isDev) {
        console.log('🔧 检测到开发环境，自动启用调试模式');
        setTimeout(() => {
            if (window.quickSetup) {
                window.quickSetup.enableDebug();
            }
        }, 1000);
    }
}
