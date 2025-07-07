import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { safeDisplayText, safeDisplayTitle } from '../utils/htmlUtils';
import { getCategoryNames, getCategoryConfig } from '../utils/statusConfig';
import { newsApi } from '../api/newsApi';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';
import AISmartSearch from '../components/AISmartSearch';
import AINewsSummary from '../components/AINewsSummary';
import './search.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('人工智能');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [currentPage, setCurrentPage] = useState(1);
  const [newsPerPage] = useState(6); // 每页显示6条新闻
  const navigate = useNavigate();

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取新闻数据
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/news');
        const result = await response.json();
        
        if (result.code === 200 && result.data) {
          // 转换数据格式以适配搜索页面
          const transformedData = result.data.map(news => ({
            id: news.id,
            title: news.title,
            summary: news.summary,
            category: news.category,
            timeline: `${Math.floor(Math.random() * 10) + 1}个关键节点`, // 模拟数据
            followers: news.view_count || Math.floor(Math.random() * 2000) + 100,
            lastUpdate: "2小时前", // 模拟数据
            relevance: Math.floor(Math.random() * 30) + 70, // 模拟相关性分数
            published_at: news.published_at,
            source: news.source,
            author: news.author,
            image_url: news.image_url,
            view_count: news.view_count,
            like_count: news.like_count,
            comment_count: news.comment_count,
          }));
          setSearchResults(transformedData);
        }
      } catch (err) {
        console.error('获取新闻数据失败:', err);
        // 如果API调用失败，使用默认数据
        setSearchResults([
          {
            id: 1,
            title: "科技巨头AI竞赛白热化",
            summary: "多家科技公司发布最新AI产品，市场竞争进入新阶段",
            category: "科技",
            timeline: "5个关键节点",
            followers: 1234,
            lastUpdate: "2小时前",
            relevance: 95,
          },
          {
            id: 2,
            title: "人工智能在医疗领域的突破",
            summary: "AI技术在疾病诊断和药物研发方面取得重大进展",
            category: "医疗",
            timeline: "3个关键节点",
            followers: 856,
            lastUpdate: "1天前",
            relevance: 88,
          },
          {
            id: 3,
            title: "自动驾驶技术最新发展",
            summary: "多家车企和科技公司在自动驾驶领域展开激烈竞争",
            category: "汽车",
            timeline: "7个关键节点",
            followers: 1567,
            lastUpdate: "3小时前",
            relevance: 82,
          },
          {
            id: 4,
            title: "AI芯片技术突破",
            summary: "新一代AI芯片性能大幅提升，功耗显著降低",
            category: "科技",
            timeline: "4个关键节点",
            followers: 2341,
            lastUpdate: "5小时前",
            relevance: 78,
          },
          {
            id: 5,
            title: "人工智能教育应用",
            summary: "AI技术在教育领域的创新应用，个性化学习成为可能",
            category: "教育",
            timeline: "6个关键节点",
            followers: 987,
            lastUpdate: "1天前",
            relevance: 75,
          },
          {
            id: 6,
            title: "AI在金融科技中的应用",
            summary: "人工智能技术推动金融行业数字化转型",
            category: "经济",
            timeline: "8个关键节点",
            followers: 1456,
            lastUpdate: "4小时前",
            relevance: 72,
          },
          {
            id: 7,
            title: "人工智能伦理讨论",
            summary: "社会各界对AI技术发展中的伦理问题展开深入讨论",
            category: "社会",
            timeline: "2个关键节点",
            followers: 654,
            lastUpdate: "2天前",
            relevance: 68,
          },
          {
            id: 8,
            title: "AI在环保领域的应用",
            summary: "人工智能技术助力环境保护和可持续发展",
            category: "环境",
            timeline: "5个关键节点",
            followers: 789,
            lastUpdate: "6小时前",
            relevance: 65,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const hotKeywords = [
    "人工智能",
    "气候变化",
    "新能源",
    "区块链",
    "元宇宙",
    "量子计算",
    "生物技术",
    "太空探索",
    "5G技术",
    "电动汽车",
  ];

  const categories = useMemo(() => {
    const categoryNames = getCategoryNames();
    return categoryNames.map(name => ({
      name,
      count: Math.floor(Math.random() * 1000) + 400 // 模拟数据
    }));
  }, []);

  // 筛选和排序搜索结果
  const filteredAndSortedResults = useMemo(() => {
    let filtered = searchResults;

    // 按分类筛选
    if (selectedCategory !== 'all') {
      const categoryNames = getCategoryNames();
      const targetCategory = categoryNames.find(name => {
        const config = getCategoryConfig(name);
        return config.id === selectedCategory;
      });
      if (targetCategory) {
        filtered = filtered.filter(result => result.category === targetCategory);
      }
    }

    // 按搜索关键词筛选
    if (searchQuery) {
      filtered = filtered.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevance - a.relevance;
        case 'time':
          // 根据发布时间排序
          if (a.published_at && b.published_at) {
            return new Date(b.published_at) - new Date(a.published_at);
          }
          return 0;
        case 'popularity':
          return (b.view_count || 0) - (a.view_count || 0);
        default:
          return b.relevance - a.relevance;
      }
    });

    return filtered;
  }, [searchResults, searchQuery, selectedCategory, sortBy]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedResults.length / newsPerPage);
  const startIndex = (currentPage - 1) * newsPerPage;
  const endIndex = startIndex + newsPerPage;
  const currentResults = filteredAndSortedResults.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, timeFilter]);

  // 处理搜索
  const handleSearch = async () => {
    setCurrentPage(1);
    setLoading(true);
    
    try {
      await performSearch(searchQuery, 'normal');
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理智能搜索
  const handleSmartSearch = async (searchParams) => {
    console.log('智能搜索参数:', searchParams);
    setSearchQuery(searchParams.query);
    setCurrentPage(1);
    setLoading(true);
    
    try {
      // 根据搜索模式处理不同的搜索逻辑
      if (searchParams.mode === 'semantic') {
        // 语义搜索逻辑 - 这里可以调用后端的语义搜索API
        console.log('执行语义搜索:', searchParams);
        await performSearch(searchParams.query, searchParams.mode);
      } else if (searchParams.mode === 'keywords') {
        // 关键词搜索逻辑
        console.log('执行关键词搜索:', searchParams);
        await performSearch(searchParams.query, searchParams.mode);
      } else {
        // 普通搜索逻辑
        console.log('执行普通搜索:', searchParams);
        await performSearch(searchParams.query, searchParams.mode);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 执行实际的搜索
  const performSearch = async (query, mode = 'normal') => {
    try {
      const response = await newsApi.searchNews(query, 1, 50, mode); // 搜索更多结果，传递搜索模式
      
      if (response.code === 200 && response.data) {
        // 转换数据格式以适配搜索页面
        const transformedData = response.data.map(news => ({
          id: news.id,
          title: news.title,
          summary: news.summary,
          category: news.category,
          timeline: `${Math.floor(Math.random() * 10) + 1}个关键节点`, // 模拟数据
          followers: news.view_count || Math.floor(Math.random() * 2000) + 100,
          lastUpdate: "2小时前", // 模拟数据
          relevance: Math.floor(Math.random() * 30) + 70, // 模拟相关性分数
          published_at: news.published_at,
          source: news.source,
          author: news.author,
          image_url: news.image_url,
          view_count: news.view_count,
          like_count: news.like_count,
          comment_count: news.comment_count,
        }));
        
        // 根据搜索模式调整相关性计算
        if (mode === 'keywords') {
          // 关键词搜索：提高精确匹配的相关性
          transformedData.forEach(item => {
            const queryLower = query.toLowerCase();
            const titleMatch = item.title.toLowerCase().includes(queryLower);
            const summaryMatch = item.summary && item.summary.toLowerCase().includes(queryLower);
            
            if (titleMatch) {
              item.relevance = Math.min(item.relevance + 20, 100);
            }
            if (summaryMatch) {
              item.relevance = Math.min(item.relevance + 10, 100);
            }
          });
        } else if (mode === 'semantic') {
          // 语义搜索：模拟语义匹配分数
          transformedData.forEach(item => {
            item.relevance = Math.floor(Math.random() * 40) + 60; // 语义搜索相关性
          });
        }
        
        setSearchResults(transformedData);
      } else {
        console.warn('搜索返回空结果');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索API调用失败:', error);
      setSearchResults([]);
    }
  };

  // 处理关键词点击
  const handleKeywordClick = async (keyword) => {
    setSearchQuery(keyword);
    setCurrentPage(1);
    setLoading(true);
    
    try {
      await performSearch(keyword, 'keywords');
    } catch (error) {
      console.error('关键词搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理分类点击
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // 处理新闻点击
  const handleNewsClick = (newsId) => {
    navigate(`/newspage/${newsId}`);
  };

  return (
    <div className="searchpage-container">
      <Header />
      
      <div className="searchpage-content">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-header">
            <h1 className="search-title">智能搜索</h1>
            <p className="search-subtitle">搜索感兴趣的新闻事件，追踪完整发展过程</p>
          </div>

          {/* AI Smart Search Bar */}
          <div className="search-bar-container">
            <AISmartSearch 
              onSearch={handleSmartSearch}
              placeholder="智能搜索新闻事件..."
            />
          </div>

          {/* Search Filters */}
          <div className="search-filters">
            <div className="filter-wrapper">
              <div className="filter-label">
                <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>筛选：</span>
              </div>

              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">全部分类</option>
                {getCategoryNames().map(categoryName => {
                  const config = getCategoryConfig(categoryName);
                  return (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  );
                })}
              </select>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">相关度</option>
                <option value="time">时间</option>
                <option value="popularity">热度</option>
              </select>

              <select
                className="filter-select"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="all-time">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
          </div>
        </div>

        <div className="main-grid">
          {/* Sidebar */}
          <div className="sidebar">
            {/* Hot Keywords */}
            <div className="sidebar-card">
              <h3 className="card-title">热门关键词</h3>
              <div className="keywords-container">
                {hotKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    className={`keyword-tag ${searchQuery === keyword ? 'active' : ''}`}
                    onClick={() => handleKeywordClick(keyword)}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="sidebar-card">
              <h3 className="card-title">分类浏览</h3>
              <div className="categories-list">
                {categories.map((category) => (
                  <div key={category.name} className="category-item">
                    <button
                      className="category-name"
                      onClick={() => handleCategoryClick(category.name.toLowerCase())}
                    >
                      {category.name}
                    </button>
                    <span className="category-count">{category.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Tips */}
            <div className="sidebar-card">
              <h3 className="card-title">搜索技巧</h3>
              <div className="search-tips">
                <div className="tip-item">• 使用引号搜索精确短语</div>
                <div className="tip-item">• 使用 + 号包含必需词汇</div>
                <div className="tip-item">• 使用 - 号排除特定词汇</div>
                <div className="tip-item">• 使用 OR 搜索多个选项</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            <div className="content-header">
              <h2 className="content-title">搜索结果</h2>
              <div className="results-count">找到 {filteredAndSortedResults.length} 个相关结果</div>
            </div>

            {/* Search Results */}
            <div className="search-results">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>正在加载搜索结果...</p>
                </div>
              ) : (
                currentResults.map((result) => (
                  <div key={result.id} className="result-card" onClick={() => handleNewsClick(result.id)}>
                    <div className="result-header">
                      <div className="result-meta">
                        <span className="result-category">{result.category}</span>
                        <div className="result-relevance">相关度: {result.relevance}%</div>
                      </div>
                      <div className="result-time">
                        {result.published_at ? new Date(result.published_at).toLocaleDateString('zh-CN') : result.lastUpdate}
                      </div>
                    </div>

                    <h3 className="result-title">{safeDisplayTitle(result.title)}</h3>
                    <p className="result-summary">{safeDisplayText(result.summary, 200)}</p>

                    {/* AI总结组件 */}
                    <div className="result-ai-summary">
                      <AINewsSummary newsId={result.id} news={result} />
                    </div>

                    <div className="result-footer">
                      <div className="result-stats">
                        <div className="stat-item">
                          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {result.view_count || 0} 阅读
                        </div>
                        <div className="stat-item">
                          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {result.like_count || 0} 点赞
                        </div>
                        <div className="stat-item">
                          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {result.comment_count || 0} 评论
                        </div>
                      </div>

                      <button className="view-detail-btn">
                        查看详情
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 空状态显示 */}
            {filteredAndSortedResults.length === 0 && (
              <div className="no-results">
                <h3>未找到匹配的结果</h3>
                <p>尝试调整搜索关键词或筛选条件</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  <span>共 {filteredAndSortedResults.length} 个结果，第 {currentPage} / {totalPages} 页</span>
                </div>
                <div className="pagination-controls">
                  <button 
                    className="pagination-btn prev" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // 显示逻辑：当前页前后各2页
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 3 || 
                        page === currentPage + 3
                      ) {
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button 
                    className="pagination-btn next" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ThemeToggle className="fixed" />
    </div>
  );
};

export default SearchPage;
