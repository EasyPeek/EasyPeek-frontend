import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';
import './StoryDetailPage.css';

const StoryDetailPage = () => {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [newsTimeline, setNewsTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('desc'); // desc: 最新在前, asc: 最早在前
  const [filterType, setFilterType] = useState('all'); // all, major, minor
  const [currentPage, setCurrentPage] = useState(1);
  const [newsPerPage] = useState(5); // 每页显示5条新闻

  // 使用useMemo缓存模拟故事详情数据
  const mockStoryDetail = useMemo(() => ({
    id: parseInt(id),
    title: "AI技术发展与竞争",
    description: "追踪全球人工智能技术的最新发展动态，包括各大科技公司的AI产品发布、技术突破、市场竞争等重要事件。",
    category: "科技",
    status: "进行中",
    importance: "高",
    startDate: "2024-01-15",
    lastUpdate: "2024-12-20",
    totalNews: 45,
    tags: ["人工智能", "科技竞争", "OpenAI", "Google", "微软", "技术创新"],
    summary: "本故事追踪了2024年以来AI领域的重大发展，从ChatGPT的持续更新到Google Gemini的发布，再到各大科技公司在AI领域的激烈竞争。这些事件不仅改变了科技行业的格局，也对全球经济和社会产生了深远影响。"
  }), [id]);

  // 使用useMemo缓存模拟新闻时间线数据
  const mockNewsTimeline = useMemo(() => [
    {
      id: 1,
      date: "2024-12-20",
      time: "14:30",
      type: "major", // major, minor
      title: "OpenAI发布GPT-4 Turbo最新版本",
      summary: "OpenAI宣布推出GPT-4 Turbo的最新版本，在推理能力和响应速度方面都有显著提升。",
      source: "TechCrunch",
      impact: "高",
      relatedNews: 3
    },
    {
      id: 2,
      date: "2024-12-18",
      time: "09:15",
      type: "major",
      title: "Google Gemini Ultra正式商用",
      summary: "Google正式推出Gemini Ultra的商业版本，直接挑战OpenAI在企业AI市场的地位。",
      source: "The Verge",
      impact: "高",
      relatedNews: 5
    },
    {
      id: 3,
      date: "2024-12-15",
      time: "16:45",
      type: "minor",
      title: "微软Azure AI服务更新",
      summary: "微软更新了Azure AI服务套件，增加了新的机器学习工具和API接口。",
      source: "Microsoft Blog",
      impact: "中",
      relatedNews: 2
    },
    {
      id: 4,
      date: "2024-12-12",
      time: "11:20",
      type: "major",
      title: "AI芯片市场竞争加剧",
      summary: "英伟达、AMD和英特尔在AI芯片领域的竞争进入白热化阶段，新产品发布频繁。",
      source: "Reuters",
      impact: "高",
      relatedNews: 4
    },
    {
      id: 5,
      date: "2024-12-10",
      time: "13:30",
      type: "minor",
      title: "Meta发布新AI研究成果",
      summary: "Meta AI研究团队发布了关于多模态AI的最新研究论文，展示了新的技术突破。",
      source: "Meta AI Blog",
      impact: "中",
      relatedNews: 1
    },
    {
      id: 6,
      date: "2024-12-08",
      time: "10:00",
      type: "major",
      title: "AI监管政策新进展",
      summary: "欧盟AI法案正式生效，对AI技术的开发和应用提出了新的监管要求。",
      source: "EU Official",
      impact: "高",
      relatedNews: 6
    },
    {
      id: 7,
      date: "2024-12-05",
      time: "15:15",
      type: "minor",
      title: "百度文心一言功能升级",
      summary: "百度宣布文心一言新增多项功能，包括代码生成和图像理解能力的提升。",
      source: "Baidu News",
      impact: "中",
      relatedNews: 2
    },
    {
      id: 8,
      date: "2024-12-01",
      time: "12:45",
      type: "major",
      title: "AI安全联盟成立",
      summary: "多家科技巨头联合成立AI安全联盟，共同制定AI安全标准和最佳实践。",
      source: "AI Safety Alliance",
      impact: "高",
      relatedNews: 8
    }
  ], []);

  useEffect(() => {
    // 模拟API调用
    setLoading(true);
    setTimeout(() => {
      setStory(mockStoryDetail);
      setNewsTimeline(mockNewsTimeline);
      setLoading(false);
    }, 1000);
  }, [id, mockStoryDetail, mockNewsTimeline]);

  // 筛选和排序新闻
  const filteredAndSortedNews = newsTimeline
    .filter(news => filterType === 'all' || news.type === filterType)
    .sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedNews.length / newsPerPage);
  const startIndex = (currentPage - 1) * newsPerPage;
  const endIndex = startIndex + newsPerPage;
  const currentNews = filteredAndSortedNews.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到时间轴顶部
    const timelineElement = document.querySelector('.news-timeline-container');
    if (timelineElement) {
      timelineElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder, filterType]);

  // 获取影响级别的颜色
  const getImpactColor = (impact) => {
    switch (impact) {
      case '高': return '#ef4444';
      case '中': return '#f59e0b';
      case '低': return '#10b981';
      default: return '#6b7280';
    }
  };

  // 获取新闻类型的图标
  const getNewsTypeIcon = (type) => {
    return type === 'major' ? '🔥' : '📰';
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="story-detail-container">
        <Header />
        <div className="story-detail-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载故事详情中...</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="story-detail-container">
        <Header />
        <div className="story-detail-content">
          <div className="error-state">
            <h2>故事未找到</h2>
            <p>抱歉，无法找到您要查看的故事。</p>
            <Link to="/stories" className="back-btn">返回故事列表</Link>
          </div>
        </div>
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="story-detail-container">
      <Header />
      
      <div className="story-detail-content">
        {/* 故事头部信息 */}
        <div className="story-detail-header">
          <div className="breadcrumb">
            <Link to="/stories">故事</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="current-page">{story.title}</span>
          </div>
          
          <div className="story-info-card">
            <div className="story-meta-row">
              <div className="story-badges">
                <span className="story-category">{story.category}</span>
                <span className={`story-status ${story.status === '进行中' ? 'ongoing' : 'completed'}`}>
                  {story.status}
                </span>
                <span className="story-importance" style={{color: getImpactColor(story.importance)}}>
                  重要性: {story.importance}
                </span>
              </div>
              <div className="story-dates">
                <span className="start-date">开始: {formatDate(story.startDate)}</span>
                <span className="last-update">更新: {formatDate(story.lastUpdate)}</span>
              </div>
            </div>
            
            <h1 className="story-detail-title">{story.title}</h1>
            <p className="story-detail-description">{story.description}</p>
            
            <div className="story-summary">
              <h3>故事概要</h3>
              <p>{story.summary}</p>
            </div>
            
            <div className="story-stats-row">
              <div className="stat-item">
                <span className="stat-number">{story.totalNews}</span>
                <span className="stat-label">相关新闻</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{filteredAndSortedNews.length}</span>
                <span className="stat-label">时间线事件</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{story.tags.length}</span>
                <span className="stat-label">相关标签</span>
              </div>
            </div>
            
            <div className="story-tags-section">
              <h4>相关标签</h4>
              <div className="story-tags">
                {story.tags.map((tag, index) => (
                  <span key={index} className="story-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 时间线控制 */}
        <div className="timeline-controls">
          <h2>新闻时间线</h2>
          <div className="controls-row">
            <div className="sort-control">
              <label>排序方式:</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="control-select"
              >
                <option value="desc">最新在前</option>
                <option value="asc">最早在前</option>
              </select>
            </div>
            <div className="filter-control">
              <label>事件类型:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="control-select"
              >
                <option value="all">全部事件</option>
                <option value="major">重大事件</option>
                <option value="minor">一般事件</option>
              </select>
            </div>
          </div>
        </div>

        {/* 新闻时间线 */}
        <div className="news-timeline-container">
          <div className="timeline-line"></div>
          
          {currentNews.map((news, index) => (
            <div key={news.id} className={`timeline-news-item ${index % 2 === 0 ? 'left' : 'right'}`}>
              <div className="timeline-news-marker">
                <span className="news-type-icon">{getNewsTypeIcon(news.type)}</span>
              </div>
              
              <div className="news-card">
                <div className="news-header">
                  <div className="news-meta">
                    <span className="news-date">{formatDate(news.date)}</span>
                    <span className="news-time">{news.time}</span>
                    <span className={`news-type ${news.type}`}>
                      {news.type === 'major' ? '重大事件' : '一般事件'}
                    </span>
                  </div>
                  <div className="news-impact" style={{color: getImpactColor(news.impact)}}>
                    影响: {news.impact}
                  </div>
                </div>
                
                <h3 className="news-title">
                  <Link to={`/newspage/${news.id}`}>{news.title}</Link>
                </h3>
                
                <p className="news-summary">{news.summary}</p>
                
                <div className="news-footer">
                  <div className="news-source">
                    <span>来源: {news.source}</span>
                  </div>
                  <div className="news-related">
                    <span>{news.relatedNews} 条相关新闻</span>
                  </div>
                </div>
                
                <div className="news-actions">
                  <Link to={`/newspage/${news.id}`} className="read-news-btn">
                    阅读详情 →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedNews.length === 0 && (
          <div className="no-news-results">
            <h3>暂无符合条件的新闻</h3>
            <p>请尝试调整筛选条件</p>
          </div>
        )}

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>共 {filteredAndSortedNews.length} 条新闻，第 {currentPage} / {totalPages} 页</span>
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn prev" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← 上一页
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
                下一页 →
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 浮动按钮组 */}
      <ThemeToggle className="fixed" />
    </div>
  );
};

export default StoryDetailPage;