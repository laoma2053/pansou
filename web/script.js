// 全局变量
let currentResults = null;
let isSearching = false;

// DOM元素
const container = document.getElementById('container');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchBtnMain = document.getElementById('searchBtnMain');
const luckyBtn = document.getElementById('luckyBtn');
const sourceType = document.getElementById('sourceType');
const refreshCache = document.getElementById('refreshCache');
const loadingDiv = document.getElementById('loadingDiv');
const resultsDiv = document.getElementById('resultsDiv');
const errorDiv = document.getElementById('errorDiv');
const resultCount = document.getElementById('resultCount');
const mergedResults = document.getElementById('mergedResults');
const listResults = document.getElementById('listResults');

// 网盘类型图标映射
const netdiskIcons = {
    'baidu': 'fas fa-cloud',
    'aliyun': 'fab fa-alipay',
    'quark': 'fas fa-atom',
    'tianyi': 'fas fa-cloud-download-alt',
    'uc': 'fas fa-cloud-upload-alt',
    'caiyun': 'fas fa-mobile-alt',
    '115': 'fas fa-hdd',
    'pikpak': 'fas fa-archive',
    'xunlei': 'fas fa-bolt',
    '123': 'fas fa-folder',
    'magnet': 'fas fa-magnet',
    'ed2k': 'fas fa-link'
};

// 网盘类型中文名称映射
const netdiskNames = {
    'baidu': '百度网盘',
    'aliyun': '阿里云盘',
    'quark': '夸克网盘',
    'tianyi': '天翼云盘',
    'uc': 'UC网盘',
    'caiyun': '移动云盘',
    '115': '115网盘',
    'pikpak': 'PikPak',
    'xunlei': '迅雷网盘',
    '123': '123网盘',
    'magnet': '磁力链接',
    'ed2k': '电驴链接'
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    checkServiceHealth();
});

// 初始化事件监听器
function initEventListeners() {
    // 搜索按钮点击
    searchBtn.addEventListener('click', performSearch);
    searchBtnMain.addEventListener('click', performSearch);
    
    // 手气不错按钮
    luckyBtn.addEventListener('click', function() {
        searchInput.value = getRandomKeyword();
        performSearch();
    });
    
    // 输入框回车搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// 获取随机搜索关键词
function getRandomKeyword() {
    const keywords = ['电影', '音乐', '软件', '游戏', '小说', '综艺', '动漫', '纪录片'];
    return keywords[Math.floor(Math.random() * keywords.length)];
}

// 检查服务健康状态
async function checkServiceHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('服务状态:', data);
    } catch (error) {
        console.error('服务健康检查失败:', error);
    }
}

// 切换到搜索结果布局
function switchToResultsLayout() {
    container.className = 'container results-layout';
}

// 切换到首页布局
function switchToHomeLayout() {
    container.className = 'container home-layout';
    hideResults();
    hideError();
}

// 执行搜索
async function performSearch() {
    const keyword = searchInput.value.trim();
    
    if (!keyword) {
        showError('请输入搜索关键词');
        return;
    }
    
    if (isSearching) {
        return;
    }
    
    // 切换到搜索结果布局
    switchToResultsLayout();
    
    isSearching = true;
    showLoading();
    hideError();
    hideResults();
    
    try {
        const searchParams = {
            kw: keyword,
            src: sourceType.value,
            refresh: refreshCache.checked
        };
        
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        currentResults = data;
        
        hideLoading();
        displayResults(data);
        
    } catch (error) {
        console.error('搜索出错:', error);
        hideLoading();
        showError('搜索失败: ' + error.message);
    } finally {
        isSearching = false;
    }
}

// 显示搜索结果
function displayResults(data) {
    if (!data || (!data.results && !data.merged_by_type)) {
        showError('没有找到搜索结果');
        return;
    }
    
    // 更新结果计数
    const total = data.total || 0;
    resultCount.textContent = `找到约 ${total.toLocaleString()} 条结果`;
    
    // 动态生成标签页
    generateTabs(data.merged_by_type);
    
    // 显示详细列表结果 (默认显示)
    if (data.results) {
        displayListResults(data.results);
    }
    
    // 显示按类型分组的结果
    if (data.merged_by_type) {
        displayMergedResults(data.merged_by_type);
    }
    
    showResults();
}

// 动态生成标签页
function generateTabs(mergedData) {
    const tabsContainer = document.querySelector('.result-tabs');
    tabsContainer.innerHTML = '';
    
    // 总是有"全部"标签
    const allTab = document.createElement('button');
    allTab.className = 'tab-btn active';
    allTab.dataset.type = 'list';
    allTab.textContent = '全部';
    allTab.addEventListener('click', () => switchTab('list'));
    tabsContainer.appendChild(allTab);
    
    if (mergedData && Object.keys(mergedData).length > 0) {
        // 网盘类型优先级排序
        const netdiskPriority = {
            'baidu': 1,   // 百度网盘
            'quark': 2,   // 夸克网盘
            'ali': 3,     // 阿里云盘
            'uc': 4,      // UC网盘
            '115': 5,     // 115网盘
            'lanzou': 6,  // 蓝奏云
            'tianyi': 7,  // 天翼云盘
            'weiyun': 8,  // 微云
            'jianguoyun': 9, // 坚果云
            'onedrive': 10,  // OneDrive
            'other': 99   // 其他类型
        };
        
        // 按优先级和结果数量排序
        const sortedTypes = Object.entries(mergedData)
            .map(([type, data]) => ({
                type,
                count: Array.isArray(data) ? data.length : (data.links ? data.links.length : 0),
                priority: netdiskPriority[type] || 99
            }))
            .sort((a, b) => {
                // 先按优先级排序，再按结果数量降序排序
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return b.count - a.count;
            });
        
        // 为每个有结果的网盘类型创建标签
        sortedTypes.forEach(({type, count}) => {
            if (count > 0) {
                const tab = document.createElement('button');
                tab.className = 'tab-btn';
                tab.dataset.type = type;
                tab.textContent = `${netdiskNames[type] || type}(${count})`;
                tab.addEventListener('click', () => switchTab(type));
                tabsContainer.appendChild(tab);
            }
        });
    }
}

// 显示Google风格的搜索结果列表
function displayListResults(results) {
    listResults.innerHTML = '';
    
    if (!results || results.length === 0) {
        listResults.innerHTML = '<div class="no-results">没有找到相关结果</div>';
        return;
    }
    
    results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        const links = result.links || [];
        
        // 生成网盘链接HTML，使用新的简洁格式
        const linksHtml = links.map(link => {
            const icon = netdiskIcons[link.type] || 'fas fa-link';
            const name = netdiskNames[link.type] || link.type;
            const passwordElement = link.password ? 
                `<span class="password-code" onclick="copyPasswordCode('${link.password}', event)" title="点击复制提取码">${link.password}</span>` : '';
            
            return `
                <div class="result-netdisk-item">
                    <a href="${link.url}" class="netdisk-link" target="_blank">
                        <i class="${icon}"></i>
                        ${name}
                    </a>
                    ${passwordElement}
                </div>
            `;
        }).join('');
        
        // 确定来源类型和图标
        const sourceType = result.source_type || 'plugin'; // tg 或 plugin
        const sourceIcon = sourceType === 'tg' ? 'fab fa-telegram' : 'fas fa-globe';
        const sourceText = result.channel || '未知来源';
        
        // 获取主链接URL（用于标题跳转）
        const primaryLinkUrl = links.length > 0 ? links[0].url : '#';
        
        resultDiv.innerHTML = `
            <div class="result-url">
                <i class="${sourceIcon}"></i>
                ${escapeHtml(sourceText)}
            </div>
            <a href="${primaryLinkUrl}" class="result-title" target="_blank">
                ${escapeHtml(result.title || '无标题')}
            </a>
            <div class="result-meta">
                <span class="result-date">${result.datetime ? formatDate(result.datetime) : ''}</span>
            </div>
            <div class="result-snippet">
                ${escapeHtml(result.content || '').substring(0, 200)}${result.content && result.content.length > 200 ? '...' : ''}
            </div>
            ${links.length > 0 ? `<div class="result-netdisk-links">${linksHtml}</div>` : ''}
        `;
        
        listResults.appendChild(resultDiv);
    });
}

// 显示按类型分组的结果
function displayMergedResults(mergedData) {
    mergedResults.innerHTML = '';
    
    if (!mergedData || Object.keys(mergedData).length === 0) {
        mergedResults.innerHTML = '<div class="no-results">没有找到分组结果</div>';
        return;
    }
    
    for (const [type, links] of Object.entries(mergedData)) {
        if (!links || links.length === 0) continue;
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'netdisk-group';
        groupDiv.setAttribute('data-netdisk-type', type); // 添加网盘类型标识
        
        const icon = netdiskIcons[type] || 'fas fa-cloud';
        const name = netdiskNames[type] || type.toUpperCase();
        
        groupDiv.innerHTML = `
            <div class="netdisk-title">
                <i class="${icon}"></i>
                ${name}
                <span class="netdisk-count">(${links.length})</span>
            </div>
            <div class="netdisk-links">
                ${links.map(link => createLinkItem(link)).join('')}
            </div>
        `;
        
        mergedResults.appendChild(groupDiv);
    }
}

// 创建链接项
function createLinkItem(link) {
    const passwordElement = link.password ? 
        `<div class="link-password">
            <span class="password-label">提取码:</span>
            <span class="password-code" onclick="copyPasswordCode('${link.password}', event)" title="点击复制提取码">${link.password}</span>
        </div>` : '';
    const note = link.note ? `<div class="link-title">${escapeHtml(link.note)}</div>` : '';
    const date = link.datetime ? `<div class="link-date">${formatDate(link.datetime)}</div>` : '';
    
    return `
        <div class="link-item" onclick="copyToClipboard('${link.url}')">
            ${note}
            <div class="link-url">${escapeHtml(link.url)}</div>
            <div class="link-details">
                ${passwordElement}
                ${date}
            </div>
        </div>
    `;
}

// 切换标签页
function switchTab(type) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    if (type === 'list') {
        // 显示全部结果列表
        document.getElementById('listResults').classList.add('active');
        document.getElementById('mergedResults').classList.remove('active');
    } else {
        // 显示特定网盘类型的结果
        document.getElementById('listResults').classList.remove('active');
        document.getElementById('mergedResults').classList.add('active');
        
        // 在分组结果中只显示选中的网盘类型
        displaySpecificNetdiskType(type);
    }
}

// 显示特定网盘类型的结果
function displaySpecificNetdiskType(netdiskType) {
    const mergedResults = document.getElementById('mergedResults');
    
    // 获取所有网盘分组
    const allGroups = mergedResults.querySelectorAll('.netdisk-group');
    
    if (netdiskType === 'merged') {
        // 显示所有分组
        allGroups.forEach(group => {
            group.style.display = 'block';
        });
    } else {
        // 隐藏所有网盘分组
        allGroups.forEach(group => {
            group.style.display = 'none';
        });
        
        // 只显示选中的网盘类型
        const targetGroup = mergedResults.querySelector(`[data-netdisk-type="${netdiskType}"]`);
        if (targetGroup) {
            targetGroup.style.display = 'block';
        }
    }
}

// 复制提取码
function copyPasswordCode(password, event) {
    event.stopPropagation(); // 阻止事件冒泡
    copyToClipboard(password);
    showToast(`提取码 "${password}" 已复制到剪贴板`);
}

// 复制搜索内容
function copySearchContent(content) {
    copyToClipboard(content);
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板');
    } catch (error) {
        console.error('复制失败:', error);
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板');
        } catch (err) {
            showToast('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
    }
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a73e8;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-size: 14px;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

// 显示加载状态
function showLoading() {
    loadingDiv.classList.remove('hidden');
}

// 隐藏加载状态
function hideLoading() {
    loadingDiv.classList.add('hidden');
}

// 显示结果
function showResults() {
    resultsDiv.classList.remove('hidden');
}

// 隐藏结果
function hideResults() {
    resultsDiv.classList.add('hidden');
}

// 显示错误
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorDiv.classList.remove('hidden');
}

// 隐藏错误
function hideError() {
    errorDiv.classList.add('hidden');
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化日期
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return '今天';
        } else if (diffDays === 1) {
            return '昨天';
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
    } catch (error) {
        return dateString;
    }
}
