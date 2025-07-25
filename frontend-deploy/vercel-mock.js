// Vercel部署版本 - 使用模拟数据
// 由于Vercel是静态部署，我们使用本地模拟数据展示UI效果

// 保存原始的showSearchResults函数
const originalShowSearchResults = window.showSearchResults;

// 重写API调用函数为模拟数据
function showSearchResults() {
    const container = document.getElementById('container');
    if (container) {
        container.classList.add('results-layout');
    }
    
    // 隐藏搜索按钮
    const searchButtons = document.querySelector('.search-buttons');
    if (searchButtons) {
        searchButtons.style.display = 'none';
    }
    
    // 生成动态标签页
    generateTabs();
    
    // 显示模拟搜索结果
    displayMockResults();
}

// 模拟搜索结果数据
function displayMockResults() {
    const mockResults = [
        {
            title: "速度与激情9 (2021) 4K蓝光原盘",
            url: "https://example.com/fast9-4k",
            description: "速度与激情9 Fast & Furious 9 (2021) 4K UHD 蓝光原盘 REMUX 中英双语 内嵌中英双语字幕",
            source: "阿里云盘",
            size: "65.8GB",
            time: "2024-01-15"
        },
        {
            title: "速度与激情1-9合集 高清收藏版",
            url: "https://example.com/fast-collection",
            description: "速度与激情系列电影1-9部合集 1080P高清 中英双语 完整收藏版",
            source: "百度网盘", 
            size: "28.5GB",
            time: "2024-01-10"
        },
        {
            title: "速度与激情：特别行动 4K版本",
            url: "https://example.com/hobbs-shaw-4k",
            description: "速度与激情：特别行动 Hobbs & Shaw (2019) 4K HDR 杜比全景声 中英双语",
            source: "夸克网盘",
            size: "45.2GB", 
            time: "2024-01-08"
        },
        {
            title: "速度与激情8 命运的愤怒 导演剪辑版",
            url: "https://example.com/fast8-director",
            description: "速度与激情8 The Fate of the Furious (2017) 导演剪辑版 1080P 中英双语字幕",
            source: "115网盘",
            size: "18.9GB",
            time: "2024-01-05"
        }
    ];
    
    displayListResults(mockResults);
    
    // 更新统计信息
    document.getElementById('totalResults').textContent = '1,247';
    document.getElementById('searchTime').textContent = '0.18';
}

// 如果在Vercel环境下，替换搜索函数
if (window.location.hostname.includes('vercel.app') || 
    window.location.hostname.includes('localhost') ||
    window.location.protocol === 'file:') {
    
    // 页面加载完成后自动显示结果
    document.addEventListener('DOMContentLoaded', function() {
        // 小延迟确保所有脚本加载完成
        setTimeout(showSearchResults, 100);
    });
    
    // 重写搜索按钮事件
    document.addEventListener('DOMContentLoaded', function() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', showSearchResults);
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    showSearchResults();
                }
            });
        }
    });
}
