import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';
import './StoryDetailPage.css';

const StoryDetailPage = () => {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [newsTimeline, setNewsTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // desc: 最新在前, asc: 最早在前
  const [filterType, setFilterType] = useState('all'); // all, major, minor
  const [currentPage, setCurrentPage] = useState(1);
  const [newsPerPage] = useState(5); // 每页显示5条新闻
  const [eventStats, setEventStats] = useState(null);

  // API调用函数
  const fetchEventDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/events/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        setStory(data.data);
        // 记录浏览行为
        await fetch(`http://localhost:8080/api/v1/events/${id}/view`, {
          method: 'POST'
        }).catch(err => console.warn('记录浏览失败:', err));
      } else {
        throw new Error(data.message || '获取事件详情失败');
      }
    } catch (err) {
      console.error('获取事件详情失败:', err);
      setError(err.message || '获取事件详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取事件相关新闻
  const fetchEventNews = async () => {
    setNewsLoading(true);
    setNewsError(null);
    
    try {
      const response = await fetch(`http://localhost:8080/api/v1/events/${id}/news`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        setNewsTimeline(data.data || []);
      } else {
        throw new Error(data.message || '获取相关新闻失败');
      }
    } catch (err) {
      console.error('获取相关新闻失败:', err);
      setNewsError(err.message || '获取相关新闻失败，请稍后重试');
      setNewsTimeline([]);
    } finally {
      setNewsLoading(false);
    }
  };

  // 获取事件统计信息
  const fetchEventStats = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/events/${id}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === 200) {
          setEventStats(data.data);
        }
      }
    } catch (err) {
      console.warn('获取事件统计失败:', err);
    }
  };

  // 数据格式转换函数
  const formatStoryData = (eventData) => {
    if (!eventData) return null;

    // 解析标签
    let tags = [];
    try {
      if (typeof eventData.tags === 'string' && eventData.tags.trim()) {
        tags = JSON.parse(eventData.tags);
      } else if (Array.isArray(eventData.tags)) {
        tags = eventData.tags;
      }
    } catch (e) {
      console.warn('解析标签失败:', e);
      tags = [];
    }

    // 评估重要性
    const getImportance = (hotnessScore, viewCount) => {
      if (hotnessScore >= 8 || viewCount >= 1000) return '高';
      if (hotnessScore >= 5 || viewCount >= 500) return '中';
      return '低';
    };

    return {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      status: eventData.status,
      importance: getImportance(eventData.hotness_score, eventData.view_count),
      startDate: eventData.start_time,
      lastUpdate: eventData.updated_at,
      totalNews: newsTimeline.length, // 从相关新闻数量获取
      tags: tags,
      summary: eventData.content || eventData.description,
      hotnessScore: eventData.hotness_score,
      viewCount: eventData.view_count,
      likeCount: eventData.like_count,
      commentCount: eventData.comment_count,
      shareCount: eventData.share_count
    };
  };

  // 格式化新闻数据
  const formatNewsData = (newsData) => {
    return newsData.map(news => {
      // 评估新闻影响级别
      const getImpact = (viewCount, likeCount, commentCount) => {
        const score = (viewCount || 0) + (likeCount || 0) * 2 + (commentCount || 0) * 3;
        if (score >= 100) return '高';
        if (score >= 50) return '中';
        return '低';
      };

      // 确定新闻类型（基于影响级别）
      const impact = getImpact(news.view_count, news.like_count, news.comment_count);
      const type = impact === '高' ? 'major' : 'minor';

      const publishedDate = new Date(news.published_at);
      
      return {
        id: news.id,
        date: publishedDate.toISOString().split('T')[0],
        time: publishedDate.toTimeString().slice(0, 5),
        type: type,
        title: news.title,
        summary: news.summary || news.description || (news.content ? news.content.substring(0, 150) + '...' : ''),
        source: news.source,
        impact: impact,
        relatedNews: 1 // 每条新闻本身就是一条相关新闻
      };
    });
  };

  useEffect(() => {
    if (id) {
      fetchEventDetail();
      fetchEventNews();
      fetchEventStats();
    }
  }, [id]);

  // 格式化新闻数据并进行筛选和排序
  const formattedNews = formatNewsData(newsTimeline);
  
  const filteredAndSortedNews = formattedNews
    .filter(news => filterType === 'all' || news.type === filterType)
    .sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // 格式化的故事数据
  const formattedStory = formatStoryData(story);

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

  if (error) {
    return (
      <div className="story-detail-container">
        <Header />
        <div className="story-detail-content">
          <div className="error-state">
            <h2>加载失败</h2>
            <p>{error}</p>
            <button 
              onClick={() => {
                fetchEventDetail();
                fetchEventNews();
                fetchEventStats();
              }}
              className="back-btn"
              style={{ marginRight: '16px' }}
            >
              重新加载
            </button>
            <Link to="/stories" className="back-btn">返回故事列表</Link>
          </div>
        </div>
        <ThemeToggle />
      </div>
    );
  }

  if (!story || !formattedStory) {
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
            <span className="current-page">{formattedStory.title}</span>
          </div>
          
          <div className="story-info-card">
            <div className="story-meta-row">
              <div className="story-badges">
                <span className="story-category">{formattedStory.category}</span>
                <span className={`story-status ${formattedStory.status === '进行中' ? 'ongoing' : 'completed'}`}>
                  {formattedStory.status}
                </span>
                <span className="story-importance" style={{color: getImpactColor(formattedStory.importance)}}>
                  重要性: {formattedStory.importance}
                </span>
              </div>
              <div className="story-dates">
                <span className="start-date">开始: {formatDate(formattedStory.startDate)}</span>
                <span className="last-update">更新: {formatDate(formattedStory.lastUpdate)}</span>
              </div>
            </div>
            
            <h1 className="story-detail-title">{formattedStory.title}</h1>
            <p className="story-detail-description">{formattedStory.description}</p>
            
            <div className="story-summary">
              <h3>故事概要</h3>
              <p>{formattedStory.summary}</p>
            </div>
            
            <div className="story-stats-row">
              <div className="stat-item">
                <span className="stat-number">{formattedStory.totalNews}</span>
                <span className="stat-label">相关新闻</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{formattedStory.viewCount || 0}</span>
                <span className="stat-label">浏览次数</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{(formattedStory.hotnessScore || 0).toFixed(1)}</span>
                <span className="stat-label">热度分数</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{formattedStory.likeCount || 0}</span>
                <span className="stat-label">点赞数</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{formattedStory.tags.length}</span>
                <span className="stat-label">相关标签</span>
              </div>
            </div>
            
            <div className="story-tags-section">
              <h4>相关标签</h4>
              <div className="story-tags">
                {formattedStory.tags.map((tag, index) => (
                  <span key={index} className="story-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 时间线控制 */}
        <div className="timeline-controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>新闻时间线</h2>
            <button 
              onClick={() => {
                fetchEventNews();
                fetchEventStats();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              disabled={newsLoading}
            >
              {newsLoading ? '刷新中...' : '🔄 刷新新闻'}
            </button>
          </div>
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
            <div className="news-count-info" style={{ marginLeft: '20px', color: '#6b7280' }}>
              共找到 {filteredAndSortedNews.length} 条相关新闻
            </div>
          </div>
        </div>

        {/* 新闻时间线 */}
        <div className="news-timeline-container">
          {newsLoading && (
            <div className="news-loading" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '20px', marginBottom: '16px' }}>⏳</div>
              <p>正在加载相关新闻...</p>
            </div>
          )}

          {newsError && (
            <div className="news-error" style={{ 
              textAlign: 'center', 
              padding: '40px', 
              backgroundColor: '#fee2e2', 
              borderRadius: '8px', 
              margin: '20px 0' 
            }}>
              <div style={{ fontSize: '20px', marginBottom: '16px' }}>❌</div>
              <p style={{ color: '#dc2626' }}>{newsError}</p>
              <button 
                onClick={fetchEventNews}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                重新加载新闻
              </button>
            </div>
          )}

          {!newsLoading && !newsError && (
            <>
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
            </>
          )}
        </div>

        {!newsLoading && !newsError && filteredAndSortedNews.length === 0 && (
          <div className="no-news-results">
            <h3>暂无符合条件的新闻</h3>
            <p>请尝试调整筛选条件</p>
          </div>
        )}

        {/* 分页组件 */}
        {!newsLoading && !newsError && totalPages > 1 && (
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
      
      {/* 浮动按钮组 */}
      <ThemeToggle className="fixed" />
    </div>
  );
};

export default StoryDetailPage;