// 全局变量
let currentResults = null;
let isSearching = false;

// 搜索配置
const SEARCH_CONFIG = {
    // 搜索模式配置
    enablePreciseSearch: true,  // true=启用精准搜索, false=启用模糊搜索
    
    // 其他扩展参数
    searchTitle: null,          // 英文标题，如果有的话
};

// 网盘类型过滤配置 - 排除不需要的网盘类型
const ALLOWED_CLOUD_TYPES = [
    'baidu',    // 百度网盘
    'aliyun',   // 阿里云盘
    'quark',    // 夸克网盘
    'tianyi',   // 天翼云盘
    'uc',       // UC网盘
    'mobile',   // 移动云盘
    '115',      // 115网盘
    'xunlei',   // 迅雷网盘
    '123',      // 123网盘
    'pikpak'    // PikPak
    // 排除: magnet磁力链接、ed2k电驴链接
];

// 随机loading消息
const loadingMessages = [
    "正在搜索中...",
    "正在查找最新资源...",
    "正在连接各大网盘...",
    "正在整理搜索结果...",
    "正在为您匹配最佳资源..."
];

const loadingSubMessages = [
    "正在为您查找最新的网盘资源",
    "搜索覆盖百度网盘、阿里云盘等多个平台",
    "正在智能匹配相关资源",
    "正在筛选高质量资源",
    "为您提供最全面的搜索结果"
];

// DOM元素
const container = document.getElementById('container');
const searchInput = document.getElementById('searchInput');
const searchInputResults = document.getElementById('searchInputResults');
const searchBtn = document.getElementById('searchBtn');
const searchBtnResults = document.getElementById('searchBtnResults');
const searchBtnMain = document.getElementById('searchBtnMain');
const luckyBtn = document.getElementById('luckyBtn');
const loadingDiv = document.getElementById('loadingDiv');
const resultsDiv = document.getElementById('resultsDiv');
const errorDiv = document.getElementById('errorDiv');
const mergedResults = document.getElementById('mergedResults');
const listResults = document.getElementById('listResults');
const logoLink = document.getElementById('logoLink');
const logoLinkResults = document.getElementById('logoLinkResults');

// 网盘类型图标映射
const netdiskIcons = {
    'baidu': 'fas fa-cloud',
    'aliyun': 'fab fa-alipay',
    'quark': 'fas fa-atom',
    'tianyi': 'fas fa-cloud-download-alt',
    'uc': 'fas fa-cloud-upload-alt',
    'mobile': 'fas fa-mobile-alt',
    '115': 'fas fa-hdd',
    'xunlei': 'fas fa-bolt',
    '123': 'fas fa-folder',
    'pikpak': 'fas fa-archive'
};

// 网盘类型中文名称映射
const netdiskNames = {
    'baidu': '百度网盘',
    'aliyun': '阿里云盘',
    'quark': '夸克网盘',
    'tianyi': '天翼云盘',
    'uc': 'UC网盘',
    'mobile': '移动云盘',
    '115': '115网盘',
    'xunlei': '迅雷网盘',
    '123': '123网盘',
    'pikpak': 'PikPak'
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
    
    // 结果页搜索按钮点击
    if (searchBtnResults) {
        searchBtnResults.addEventListener('click', performSearchFromResults);
    }
    
    // Logo点击回到首页
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            goToHomePage();
        });
    }
    
    if (logoLinkResults) {
        logoLinkResults.addEventListener('click', function(e) {
            e.preventDefault();
            goToHomePage();
        });
    }
    
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
    
    // 结果页输入框回车搜索
    if (searchInputResults) {
        searchInputResults.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearchFromResults();
            }
        });
    }
    
    // 初始化标签页滚动功能
    initTabsScroll();
    
    // 初始化回到顶部按钮
    initBackToTop();
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
    
    // 显示搜索头部，隐藏首页header和搜索按钮
    const header = document.querySelector('.header');
    const searchHeader = document.querySelector('.search-header');
    const searchButtons = document.querySelector('.search-buttons');
    const searchOptionsBar = document.querySelector('.search-options-bar');
    
    if (header) header.style.display = 'none';
    if (searchHeader) searchHeader.style.display = 'flex';
    if (searchButtons) searchButtons.style.display = 'none';
    if (searchOptionsBar) searchOptionsBar.style.display = 'flex'; // 显示搜索选项
    
    // 同步搜索内容到结果页搜索框
    if (searchInputResults) {
        searchInputResults.value = searchInput.value;
    }
}

// 切换到首页布局
function switchToHomeLayout() {
    container.className = 'container home-layout';
    
    // 显示首页header和搜索按钮，隐藏搜索头部
    const header = document.querySelector('.header');
    const searchHeader = document.querySelector('.search-header');
    const searchButtons = document.querySelector('.search-buttons');
    const searchOptionsBar = document.querySelector('.search-options-bar');
    
    if (header) header.style.display = 'block';
    if (searchHeader) searchHeader.style.display = 'none';
    if (searchButtons) searchButtons.style.display = 'block';
    if (searchOptionsBar) searchOptionsBar.style.display = 'none'; // 隐藏搜索选项
    
    hideResults();
    hideError();
}

// 回到首页
function goToHomePage() {
    // 清空搜索内容
    searchInput.value = '';
    
    // 切换到首页布局
    switchToHomeLayout();
    
    // 清除搜索结果
    currentResults = null;
    
    // 聚焦搜索框
    setTimeout(() => {
        searchInput.focus();
    }, 100);
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
    
    await executeSearch(keyword);
}

// 从结果页执行搜索
async function performSearchFromResults() {
    const keyword = searchInputResults.value.trim();
    
    if (!keyword) {
        showError('请输入搜索关键词');
        return;
    }
    
    if (isSearching) {
        return;
    }
    
    // 同步搜索内容到首页搜索框
    searchInput.value = keyword;
    
    await executeSearch(keyword);
}

// 执行搜索的核心逻辑
async function executeSearch(keyword) {
    isSearching = true;
    hideError();
    showLoading(); // 先显示loading，这会确保resultsDiv可见
    
    try {
        const searchParams = {
            kw: keyword,
            src: 'all', // 固定为all，搜索所有来源
            refresh: false, // 固定为false，不强制刷新
            res: 'merged_by_type',  // 使用按网盘类型分组的结果，不再需要"全部"标签
            cloud_types: ALLOWED_CLOUD_TYPES, // 使用预配置的网盘类型过滤
            ext: {
                is_all: !SEARCH_CONFIG.enablePreciseSearch  // API参数：true=模糊搜索, false=精准搜索，由SEARCH_CONFIG设置自动转换
            }
        };
        
        // 如果有英文标题，添加到扩展参数
        if (SEARCH_CONFIG.searchTitle) {
            searchParams.ext.title_en = SEARCH_CONFIG.searchTitle;
        }
        
        // 调试信息：打印搜索参数
        console.log('搜索参数:', JSON.stringify(searchParams, null, 2));
        
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
        }
        
        // 获取响应文本，用于调试
        const responseText = await response.text();
        console.log('API原始响应长度:', responseText.length);
        console.log('API原始响应前200字符:', responseText.substring(0, 200));
        
        // 尝试解析JSON
        let apiResponse;
        try {
            apiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON解析错误:', parseError);
            console.error('响应文本末尾200字符:', responseText.substring(Math.max(0, responseText.length - 200)));
            throw new Error(`JSON解析失败: ${parseError.message}. 响应长度: ${responseText.length}`);
        }
        
        console.log('API响应数据:', apiResponse); // 调试信息
        
        // 检查API响应格式
        if (apiResponse.code !== 0) {
            throw new Error(apiResponse.message || '搜索失败');
        }
        
        // 提取实际数据
        const data = apiResponse.data;
        currentResults = data;
        
        hideLoading();
        displayResults(data);
        
    } catch (error) {
        console.error('搜索API错误:', error);
        hideLoading();
        
        let errorMessage = '搜索失败: ';
        if (error.message.includes('HTTP错误')) {
            errorMessage += error.message + ' - 可能是API服务未启动或配置错误';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += '无法连接到API服务，请检查服务是否正常运行';
        } else {
            errorMessage += error.message;
        }
        
        showError(errorMessage);
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
    
    // 更新结果计数 - 已删除结果统计显示，注释掉此功能
    const total = data.total || 0;
    // resultCount.textContent = `找到约 ${total.toLocaleString()} 条结果`;
    
    // 先显示按类型分组的结果
    if (data.merged_by_type) {
        displayMergedResults(data.merged_by_type);
    }
    
    // 然后动态生成标签页（这会自动切换到第一个标签并隐藏其他网盘类型）
    generateTabs(data.merged_by_type);
    
    // 显示详细列表结果 (保留但不激活)
    if (data.results) {
        displayListResults(data.results);
    }
    
    showResults();
}

// 动态生成标签页
function generateTabs(mergedData) {
    const tabsContainer = document.querySelector('.result-tabs');
    
    // 计算总结果数 - 使用API返回的total或从results数组计算
    let totalCount = 0;
    if (currentResults) {
        // 优先使用API返回的total字段
        if (currentResults.total !== undefined) {
            totalCount = currentResults.total;
        } else if (currentResults.results && Array.isArray(currentResults.results)) {
            // 如果没有total字段，则从results数组计算
            totalCount = currentResults.results.length;
        }
    }
    
    // 清空所有标签
    const allTabs = tabsContainer.querySelectorAll('.tab-btn');
    allTabs.forEach(tab => tab.remove());
    
    // 不再创建"全部"标签，直接创建网盘类型标签
    
    if (mergedData && Object.keys(mergedData).length > 0) {
        // 网盘类型优先级排序 - 按照指定顺序：百度-夸克-123-阿里-115-天翼-迅雷-移动-UC-PikPak
        const netdiskPriority = {
            'baidu': 1,   // 百度网盘
            'quark': 2,   // 夸克网盘
            '123': 3,     // 123网盘
            'aliyun': 4,  // 阿里云盘
            '115': 5,     // 115网盘
            'tianyi': 6,  // 天翼云盘
            'xunlei': 7,  // 迅雷网盘
            'mobile': 8,  // 移动云盘
            'uc': 9,      // UC网盘
            'pikpak': 10, // PikPak
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
        let isFirstTab = true;  // 标记第一个标签
        sortedTypes.forEach(({type, count}) => {
            if (count > 0) {
                const tab = document.createElement('button');
                tab.className = isFirstTab ? 'tab-btn active' : 'tab-btn';  // 第一个标签设为激活状态
                tab.dataset.type = type;
                tab.textContent = `${netdiskNames[type] || type}(${count})`;
                tab.addEventListener('click', () => switchTab(type));
                tabsContainer.appendChild(tab);
                
                // 如果是第一个标签，自动切换到该类型
                if (isFirstTab) {
                    // 使用setTimeout确保DOM渲染完成后再切换
                    setTimeout(() => switchTab(type), 0);
                    isFirstTab = false;
                }
            }
        });
    }
    
    // 延迟检查是否需要显示滚动箭头，确保DOM渲染完成
    setTimeout(() => {
        checkTabsScrollArrow();
    }, 100);
}

// 检查是否需要显示滚动箭头
function checkTabsScrollArrow() {
    const tabsContainer = document.querySelector('.result-tabs');
    const leftArrow = document.getElementById('tabsScrollLeft');
    const rightArrow = document.getElementById('tabsScrollRight');
    
    console.log('检查滚动箭头:', {
        tabsContainer: !!tabsContainer,
        leftArrow: !!leftArrow,
        rightArrow: !!rightArrow,
        scrollWidth: tabsContainer?.scrollWidth,
        clientWidth: tabsContainer?.clientWidth,
        scrollLeft: tabsContainer?.scrollLeft
    });
    
    // 如果元素不存在，直接返回，不报错
    if (!tabsContainer || !leftArrow || !rightArrow) {
        console.log('元素不存在，返回');
        return;
    }
    
    // 检查是否需要滚动（内容宽度超过容器宽度）
    const needsScroll = tabsContainer.scrollWidth > tabsContainer.clientWidth;
    
    if (!needsScroll) {
        // 不需要滚动时，隐藏所有箭头
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
        console.log('不需要滚动，隐藏所有箭头');
        return;
    }
    
    // 检查左箭头：如果已经滚动到最左边，隐藏左箭头
    if (tabsContainer.scrollLeft <= 0) {
        leftArrow.style.display = 'none';
        console.log('隐藏左箭头');
    } else {
        leftArrow.style.display = 'flex';
        console.log('显示左箭头');
    }
    
    // 检查右箭头：如果已经滚动到最右边，隐藏右箭头
    const maxScrollLeft = tabsContainer.scrollWidth - tabsContainer.clientWidth;
    if (tabsContainer.scrollLeft >= maxScrollLeft - 1) { // -1 容错
        rightArrow.style.display = 'none';
        console.log('隐藏右箭头');
    } else {
        rightArrow.style.display = 'flex';
        console.log('显示右箭头');
    }
}

// 初始化滚动箭头事件
function initTabsScroll() {
    const leftArrow = document.getElementById('tabsScrollLeft');
    const rightArrow = document.getElementById('tabsScrollRight');
    const tabsContainer = document.querySelector('.result-tabs');
    
    // 如果元素不存在，直接返回，不绑定事件
    if (!leftArrow || !rightArrow || !tabsContainer) {
        return;
    }
    
    // 左箭头点击事件：向左滚动
    leftArrow.addEventListener('click', () => {
        tabsContainer.scrollBy({
            left: -200, // 向左滚动200px
            behavior: 'smooth'
        });
        // 滚动完成后更新箭头显示状态
        setTimeout(() => checkTabsScrollArrow(), 300);
    });
    
    // 右箭头点击事件：向右滚动
    rightArrow.addEventListener('click', () => {
        tabsContainer.scrollBy({
            left: 200, // 向右滚动200px
            behavior: 'smooth'
        });
        // 滚动完成后更新箭头显示状态
        setTimeout(() => checkTabsScrollArrow(), 300);
    });
    
    // 监听滚动事件，实时更新箭头状态
    tabsContainer.addEventListener('scroll', () => {
        checkTabsScrollArrow();
    });
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
        
        // 获取主链接URL（用于标题跳转）
        const primaryLinkUrl = links.length > 0 ? links[0].url : '#';
        
        resultDiv.innerHTML = `
            <a href="${primaryLinkUrl}" class="result-title" target="_blank">
                ${escapeHtml(result.title || '无标题')}
            </a>
            <div class="result-meta">
                <span class="result-date">${result.datetime ? `资源分享时间：${formatDate(result.datetime)}` : ''}</span>
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
    
    // 提取纯净标题：从note中提取主要标题，去除过多描述
    const cleanTitle = extractCleanTitle(link.note);
    const note = cleanTitle ? `<div class="link-title"><a href="${link.url}" target="_blank">${escapeHtml(cleanTitle)}</a></div>` : '';
    const date = link.datetime ? `<div class="link-date">${formatDate(link.datetime)}</div>` : '';
    
    return `
        <div class="link-item">
            ${note}
            <div class="link-url"><a href="${link.url}" target="_blank">${escapeHtml(link.url)}</a></div>
            <div class="link-details">
                ${passwordElement}
                ${date}
            </div>
        </div>
    `;
}

// 提取纯净标题：从note中提取主要标题，去除过多描述
function extractCleanTitle(note) {
    if (!note) return '';
    
    // 去除HTML标签
    let cleanText = note.replace(/<[^>]*>/g, '');
    
    // 定义描述性关键词，遇到这些词就截断
    const descriptionKeywords = [
        '描述', '简介', '介绍', '说明', '内容', '详情', '详细',
        '剧情', '故事', '概述', '概要', '摘要', '总结',
        '包含', '包括', '含有', '附带', '提供',
        '资源', '文件', '大小', '格式', '清晰度',
        '更新', '时间', '发布', '上传', '分享',
        '字幕', '配音', '语言', '版本', '类型'
    ];
    
    // 首先按描述性关键词截断
    for (const keyword of descriptionKeywords) {
        const index = cleanText.indexOf(keyword);
        if (index !== -1) {
            // 找到关键词，截取关键词之前的内容
            cleanText = cleanText.substring(0, index).trim();
            break;
        }
    }
    
    // 如果截断后内容太短，尝试按其他分隔符分割
    if (cleanText.length < 3) {
        cleanText = note.replace(/<[^>]*>/g, ''); // 重新开始
        const separators = ['\n', '。', '！', '？', '，', '、', ' - ', ' | ', '：', ':', '（', '('];
        
        for (const separator of separators) {
            if (cleanText.includes(separator)) {
                const parts = cleanText.split(separator);
                const firstPart = parts[0].trim();
                if (firstPart.length > 2 && firstPart.length <= 100) {
                    cleanText = firstPart;
                    break;
                }
            }
        }
    }
    
    // 限制长度，避免标题过长
    if (cleanText.length > 80) {
        cleanText = cleanText.substring(0, 80) + '...';
    }
    
    // 去除首尾空格和常见的无意义前缀
    cleanText = cleanText.trim()
        .replace(/^【.*?】\s*/, '') // 去除【标签】
        .replace(/^\[.*?\]\s*/, '') // 去除[标签]
        .replace(/^《.*?》\s*/, '') // 提取书名号内容
        .replace(/^\d+\.\s*/, '')   // 去除序号
        .trim();
    
    return cleanText;
}

// 切换标签页
function switchTab(type) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });
    
    const listResults = document.getElementById('listResults');
    const mergedResults = document.getElementById('mergedResults');
    
    // 只显示特定网盘类型的结果（不再有"全部"选项）
    listResults.classList.remove('active');
    mergedResults.classList.add('active');
    
    // 在分组结果中只显示选中的网盘类型
    displaySpecificNetdiskType(type);
}

// 显示特定网盘类型的结果
function displaySpecificNetdiskType(netdiskType) {
    const mergedResults = document.getElementById('mergedResults');
    
    // 获取所有网盘分组
    const allGroups = mergedResults.querySelectorAll('.netdisk-group');
    
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
    const mergedResults = document.getElementById('mergedResults');
    if (mergedResults) {
        // 随机选择loading消息
        const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        const randomSubMessage = loadingSubMessages[Math.floor(Math.random() * loadingSubMessages.length)];
        
        mergedResults.innerHTML = `
            <div class="simple-loading">
                <div class="loading-main">${randomMessage}</div>
                <div class="loading-sub">${randomSubMessage}</div>
            </div>
        `;
        mergedResults.classList.add('active');
    }
    
    const listResults = document.getElementById('listResults');
    if (listResults) {
        listResults.classList.remove('active');
    }
    
    // 确保结果容器是可见的，这样loading才能显示
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
    }
}

// 隐藏加载状态
function hideLoading() {
    const mergedResults = document.getElementById('mergedResults');
    if (mergedResults) {
        const loadingElement = mergedResults.querySelector('.simple-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

// 显示结果
function showResults() {
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        // 同时显示结果统计
        const statsDiv = document.querySelector('.results-stats');
        if (statsDiv) {
            statsDiv.style.display = 'block';
        }
    }
}

// 隐藏结果
function hideResults() {
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
        // 同时隐藏结果统计
        const statsDiv = document.querySelector('.results-stats');
        if (statsDiv) {
            statsDiv.style.display = 'none';
        }
    }
}

// 显示错误
function showError(message) {
    if (errorDiv) {
        const errorText = errorDiv.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorDiv.textContent = message;
        }
        errorDiv.style.display = 'block';
    }
}

// 隐藏错误
function hideError() {
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
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

// 回到顶部按钮功能
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    // 监听滚动事件
    let scrollTimer = null;
    window.addEventListener('scroll', function() {
        // 使用防抖处理，避免频繁触发
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        
        scrollTimer = setTimeout(function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // 当滚动超过300px时显示按钮
            if (scrollTop > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }, 10);
    });
    
    // 点击回到顶部
    backToTopBtn.addEventListener('click', function() {
        // 平滑滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // 如果是搜索结果页，同时让搜索框获得焦点
        const container = document.getElementById('container');
        if (container && container.classList.contains('results-layout')) {
            const searchInput = document.getElementById('searchInputResults');
            if (searchInput) {
                setTimeout(() => {
                    searchInput.focus();
                }, 300); // 等待滚动完成后聚焦
            }
        }
    });
    
    // 键盘支持 - 按 Home 键回到顶部
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Home' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            // 确保不是在输入框中
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        }
    });
}
