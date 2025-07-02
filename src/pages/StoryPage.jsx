import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';
import { getStatusColor, getStatusText, getImportanceColor } from '../utils/statusConfig';
import './StoryPage.css';

export default function StoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [storiesPerPage] = useState(4); // 每页显示4个故事
  
  // 新增状态管理
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalStories, setTotalStories] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 分类标签映射
  const categoryLabels = {
    'all': '全部',
    '政治': '政治',
    '经济': '经济',
    '社会': '社会',
    '科技': '科技',
    '体育': '体育',
    '娱乐': '娱乐',
    '国际': '国际',
    '军事': '军事',
    '教育': '教育',
    '健康': '健康'
  };

  // API调用函数
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 映射前端排序参数到后端参数
      const getSortParam = () => {
        switch (sortBy) {
          case 'latest':
            return 'time';
          case 'oldest':
            return 'time';
          case 'hotness':
            return 'hotness';
          case 'views':
            return 'views';
          default:
            return 'time';
        }
      };

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: storiesPerPage.toString(),
        sort_by: getSortParam()
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`http://localhost:8080/api/v1/events?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 200) {
        setStories(data.data.events || []);
        setTotalStories(data.data.total || 0);
        setTotalPages(Math.ceil((data.data.total || 0) / storiesPerPage));
      } else {
        throw new Error(data.message || '获取事件失败');
      }
    } catch (err) {
      console.error('获取事件失败:', err);
      setError(err.message || '获取事件失败，请稍后重试');
      setStories([]);
      setTotalStories(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // 获取事件分类
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/events/categories');
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === 200) {
          setCategories(['all', ...(data.data || [])]);
        }
      }
    } catch (err) {
      console.error('获取分类失败:', err);
    }
  };

  // 数据格式转换函数
  const formatEventData = (event) => {
    // 解析标签
    let tags = [];
    try {
      if (typeof event.tags === 'string' && event.tags.trim()) {
        tags = JSON.parse(event.tags);
      } else if (Array.isArray(event.tags)) {
        tags = event.tags;
      }
    } catch (e) {
      console.warn('解析标签失败:', e);
      tags = [];
    }

    // 根据分类设置缩略图
    const categoryThumbnails = {
      '政治': '🏛️',
      '经济': '📈',
      '社会': '🏘️',
      '科技': '🤖',
      '体育': '🏅',
      '娱乐': '🎬',
      '国际': '🌍',
      '军事': '🪖',
      '教育': '📚',
      '健康': '🏥'
    };

    // 简单的重要性评估
    const getImportance = (hotnessScore, viewCount) => {
      if (hotnessScore >= 8 || viewCount >= 1000) return 'high';
      if (hotnessScore >= 5 || viewCount >= 500) return 'medium';
      return 'low';
    };

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      newsCount: 0, // 需要单独获取相关新闻数量
      startDate: new Date(event.start_time).toISOString().split('T')[0],
      lastUpdate: new Date(event.updated_at).toISOString().split('T')[0],
      status: event.status === '进行中' ? 'ongoing' : event.status === '已结束' ? 'ended' : 'unknown',
      importance: getImportance(event.hotness_score, event.view_count),
      tags: tags,
      thumbnail: categoryThumbnails[event.category] || '📰',
      timeline: [], // 时间线数据需要从事件内容中解析或单独获取
      hotnessScore: event.hotness_score,
      viewCount: event.view_count,
      likeCount: event.like_count,
      commentCount: event.comment_count,
      shareCount: event.share_count
    };
  };

  // 使用useEffect监听数据变化并获取数据
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, selectedCategory, sortBy, searchQuery]);

  // 格式化的故事数据
  const formattedStories = stories.map(formatEventData);

  // 分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedCategory, sortBy]);

  // 获取事件相关新闻数量（可选功能）
  const fetchEventNewsCount = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/events/${eventId}/news`);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 200) {
          return data.data.length || 0;
        }
      }
    } catch (err) {
      console.warn('获取事件新闻数量失败:', err);
    }
    return 0;
  };



  return (
    <div className="storypage-container">
      <Header />
      
      <div className="storypage-content">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">全球故事时间线</h1>
          <p className="hero-subtitle">探索正在发生的重要事件，追踪新闻背后的完整故事</p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="search-filter-section">
          <div className="search-container">
            <div className="search-wrapper">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="搜索故事标题或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="search-btn">
                <span className="search-btn-icon">🔍</span>
                智能化搜索
              </button>
            </div>
          </div>

          <div className="filter-controls">
            <div className="category-filter">
              <label>分类筛选：</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-filter">
              <label>排序方式：</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="latest">最新更新</option>
                <option value="oldest">最早开始</option>
                <option value="hotness">热度排序</option>
                <option value="views">浏览量排序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p>正在加载事件数据...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="error-container" style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#fee2e2', 
            borderRadius: '8px', 
            margin: '20px 0' 
          }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
            <p style={{ color: '#dc2626', fontWeight: 'bold' }}>{error}</p>
            <button 
              onClick={fetchEvents}
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
              重新加载
            </button>
          </div>
        )}

        {/* 故事列表 */}
        {!loading && !error && (
          <div className="stories-container">
            <div className="vertical-timeline-line"></div>
            
            {formattedStories.map((story, index) => (
              <div key={story.id} className="story-item">
                <div className="story-timeline-marker">
                  <span className="timeline-icon">{story.thumbnail}</span>
                </div>
                
                <div className="story-card-horizontal">
                  {/* 左侧：标题和数据 */}
                  <div className="story-content-left">
                    <div className="story-header">
                      <div className="story-meta">
                        <span className="story-category">{story.category}</span>
                        <span 
                          className="story-status"
                          style={{ backgroundColor: getStatusColor(story.status) }}
                        >
                          {getStatusText(story.status)}
                        </span>
                        <span 
                          className="story-importance"
                          style={{ color: getImportanceColor(story.importance) }}
                        >
                          {story.importance === 'high' ? '🔥 重要' : story.importance === 'medium' ? '⚡ 一般' : '📝 普通'}
                        </span>
                      </div>
                      <div className="story-date">
                        {story.startDate} - {story.lastUpdate}
                      </div>
                    </div>

                    <h3 className="story-title">
                      <Link to={`/story/${story.id}`}>{story.title}</Link>
                    </h3>
                    
                    <p className="story-description">{story.description}</p>
                    
                    <div className="story-stats">
                      <span className="news-count">📰 {story.newsCount} 条新闻</span>
                      <span className="view-count">👁️ {story.viewCount} 浏览</span>
                      <span className="hotness-score">🔥 热度 {(story.hotnessScore || 0).toFixed(1)}</span>
                      <span className="interaction-count">❤️ {story.likeCount} 👥 {story.commentCount}</span>
                    </div>

                    <div className="story-tags">
                      {story.tags.map(tag => (
                        <span key={tag} className="story-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* 中间：时间线 */}
                  <div className="story-timeline-middle">
                    <div className="story-preview-timeline">
                      <h4>事件时间线</h4>
                      <div className="mini-timeline">
                        <div className="mini-timeline-item">
                          <div className="mini-timeline-dot"></div>
                          <div className="mini-timeline-content">
                            <span className="mini-date">{story.startDate}</span>
                            <span className="mini-event">事件开始</span>
                          </div>
                        </div>
                        <div className="mini-timeline-item">
                          <div className="mini-timeline-dot"></div>
                          <div className="mini-timeline-content">
                            <span className="mini-date">{story.lastUpdate}</span>
                            <span className="mini-event">最后更新</span>
                          </div>
                        </div>
                        <div className="mini-timeline-item">
                          <div className="mini-timeline-dot current"></div>
                          <div className="mini-timeline-content">
                            <span className="mini-date">当前</span>
                            <span className="mini-event">
                              状态: {story.status === 'ongoing' ? '进行中' : story.status === 'ended' ? '已结束' : '未知'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="story-actions-right">
                    <Link to={`/story/${story.id}`} className="view-story-btn">
                      <span className="btn-text">查看完整故事</span>
                      <span className="btn-arrow">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 无结果状态 */}
        {!loading && !error && formattedStories.length === 0 && (
          <div className="no-results">
            <h3>未找到匹配的故事</h3>
            <p>尝试调整搜索关键词或筛选条件</p>
          </div>
        )}

        {/* 分页组件 */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>共 {totalStories} 个故事，第 {currentPage} / {totalPages} 页</span>
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
}