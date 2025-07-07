import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { safeDisplayText, safeDisplayTitle, splitIntoParagraphs } from '../utils/htmlUtils';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';
import AINewsSummary from '../components/AINewsSummary';
import { addFollow, removeFollow, checkFollow, handleApiError } from '../api/userApi';
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
  const [lastStatsUpdate, setLastStatsUpdate] = useState(null);
  const [lastNewsUpdate, setLastNewsUpdate] = useState(null);
  
  // 关注功能相关状态
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 通知状态
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // 显示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // 3秒后自动隐藏
  };

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
        setLastNewsUpdate(new Date()); // 记录新闻更新时间
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
          setLastStatsUpdate(new Date()); // 记录更新时间
        }
      }
    } catch (err) {
      console.warn('获取事件统计失败:', err);
    }
  };

  // 数据格式转换函数 - 添加依赖参数确保动态更新
  const formatStoryData = (eventData, newsTimelineLength, statsData) => {
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

    // 评估重要性 - 优先使用统计数据，fallback到事件数据
    const getImportance = (hotnessScore, viewCount) => {
      if (hotnessScore >= 8 || viewCount >= 1000) return '高';
      if (hotnessScore >= 5 || viewCount >= 500) return '中';
      return '低';
    };

    // 使用最新的统计数据
    const currentStats = statsData || {};
    const hotnessScore = currentStats.hotness_score ?? eventData.hotness_score;
    const viewCount = currentStats.view_count ?? eventData.view_count;
    const likeCount = currentStats.like_count ?? eventData.like_count;
    const commentCount = currentStats.comment_count ?? eventData.comment_count;
    const shareCount = currentStats.share_count ?? eventData.share_count;

    return {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      status: eventData.status,
      importance: getImportance(hotnessScore, viewCount),
      startDate: eventData.start_time,
      lastUpdate: eventData.updated_at,
      totalNews: newsTimelineLength, // 使用传入的新闻数量确保动态更新
      tags: tags,
      summary: eventData.content || eventData.description,
      hotnessScore: hotnessScore,
      viewCount: viewCount,
      likeCount: likeCount,
      commentCount: commentCount,
      shareCount: shareCount
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
        title: safeDisplayTitle(news.title),
        summary: safeDisplayText(news.summary || news.description || news.content, 150),
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
      checkFollowStatus(); // 检查关注状态
    }
  }, [id]);

  // 监听登录状态变化 - 修复依赖问题
  useEffect(() => {
    checkLoginStatus();
    // 可以监听storage变化来实时更新登录状态
    const handleStorageChange = () => {
      const wasLoggedIn = isLoggedIn;
      const nowLoggedIn = checkLoginStatus();
      if (wasLoggedIn !== nowLoggedIn) {
        if (nowLoggedIn) {
          checkFollowStatus(); // 如果刚登录，检查关注状态
        } else {
          setIsFollowing(false); // 如果退出登录，重置关注状态
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id]); // 移除isLoggedIn依赖，只依赖id

  // 格式化新闻数据并进行筛选和排序
  const formattedNews = formatNewsData(newsTimeline);
  
  const filteredAndSortedNews = formattedNews
    .filter(news => filterType === 'all' || news.type === filterType)
    .sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // 格式化的故事数据 - 传入依赖参数确保动态更新
  const formattedStory = formatStoryData(story, newsTimeline.length, eventStats);

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

  // 检查用户登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    return !!token;
  };

  // 检查是否已关注此事件 - 添加重试机制
  const checkFollowStatus = async (retryCount = 0) => {
    if (!checkLoginStatus()) {
      setIsFollowing(false);
      return;
    }
    
    try {
      const result = await checkFollow(parseInt(id));
      setIsFollowing(result.is_following || false);
    } catch (err) {
      console.warn('检查关注状态失败:', err);
      
      // 如果是网络错误且重试次数少于3次，则重试
      if (retryCount < 3 && !err.message.includes('认证失败')) {
        setTimeout(() => {
          checkFollowStatus(retryCount + 1);
        }, 1000 * (retryCount + 1)); // 递增延迟
      } else if (!err.message.includes('认证失败')) {
        console.warn(handleApiError(err));
      }
    }
  };

  // 处理关注/取消关注 - 添加状态验证和409错误处理
  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      showNotification('请先登录后再关注事件', 'warning');
      return;
    }

    // 防止重复点击
    if (followLoading) {
      return;
    }

    setFollowLoading(true);
    
    try {
      const previousState = isFollowing;
      
      if (isFollowing) {
        await removeFollow(parseInt(id));
        showNotification('已取消关注此事件', 'success');
      } else {
        await addFollow(parseInt(id));
        showNotification('已关注此事件，您将收到相关更新通知', 'success');
      }
      
      // 操作成功后重新检查状态，确保同步
      setTimeout(() => {
        checkFollowStatus();
      }, 500); // 给后端一点时间处理
      
    } catch (err) {
      console.error('关注操作失败:', err);
      
      // 特殊处理409冲突错误（已关注状态）
      if (err.message.includes('Already following')) {
        setIsFollowing(true);
        showNotification('您已经关注了此事件', 'info');
      } else {
        const errorMessage = handleApiError(err);
        showNotification(errorMessage, 'error');
      }
      
      // 无论成功失败，都重新检查状态以确保一致性
      setTimeout(() => {
        checkFollowStatus();
      }, 500);
    } finally {
      setFollowLoading(false);
    }
  };

  // 添加页面焦点时重新检查状态和刷新数据
  useEffect(() => {
    const handleFocus = () => {
      if (id) {
        // 刷新事件统计信息以获取最新数据
        fetchEventStats();
        fetchEventNews(); // 也刷新新闻时间线
        
        if (isLoggedIn) {
          checkFollowStatus();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, isLoggedIn]);

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
                if (isLoggedIn) {
                  checkFollowStatus(); // 重新检查关注状态
                }
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
                {/* 关注按钮 */}
                <button 
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  title={isLoggedIn ? (isFollowing ? '取消关注' : '关注此事件') : '请先登录'}
                >
                  {followLoading ? '处理中...' : (
                    <>
                      <span className="follow-icon">
                        {isFollowing ? '❤️' : '🤍'}
                      </span>
                      <span className="follow-text">
                        {isFollowing ? '已关注' : '关注'}
                      </span>
                    </>
                  )}
                </button>
              </div>
              <div className="story-dates">
                <span className="start-date">开始: {formatDate(formattedStory.startDate)}</span>
                <span className="last-update">更新: {formatDate(formattedStory.lastUpdate)}</span>
              </div>
            </div>
            
            <h1 className="story-detail-title">{safeDisplayTitle(formattedStory.title)}</h1>
            <p className="story-detail-description">{safeDisplayText(formattedStory.description, 300)}</p>
            
            <div className="story-summary">
              <h2>事件摘要</h2>
              <div className="summary-content">
                {(() => {
                  // 智能分段函数
                  const smartSplitText = (text) => {
                    if (!text) return [];
                    
                    // 清理文本
                    let cleanText = safeDisplayText(text);
                    if (!cleanText) return [];
                    
                    // 清理特殊符号和格式标记
                    cleanText = cleanText
                      // 清理Markdown标题标记
                      .replace(/^#{1,6}\s*/gm, '')
                      // 清理所有#符号
                      .replace(/#/g, '')
                      // 清理Markdown粗体/斜体标记
                      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
                      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
                      // 清理结构化数据标记
                      .replace(/\*\*([^*]+)\*\*:/g, '$1:')
                      .replace(/\|\s*/g, ' ')
                      // 清理多余的冒号和分隔符
                      .replace(/[:：]\s*$/gm, '')
                      .replace(/[\|\[\]]/g, '')
                      // 清理时间戳格式
                      .replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, '')
                      // 清理"来源"、"发布时间"、"摘要"等标签
                      .replace(/(来源|发布时间|摘要|标题)[:：]\s*/g, '')
                      // 清理连续的空白字符
                      .replace(/\s+/g, ' ')
                      // 清理行首行尾空白
                      .trim();
                    
                    // 如果文本较短，直接返回
                    if (cleanText.length <= 200) {
                      return [cleanText];
                    }
                    
                    // 按句号分段
                    let segments = cleanText.split(/[。！？]/).filter(s => s.trim().length > 0);
                    
                    // 如果分段效果不好，按句子分段
                    if (segments.length <= 1) {
                      segments = cleanText.split(/[.!?]/).filter(s => s.trim().length > 0);
                    }
                    
                    // 如果还是分段效果不好，按长度智能分段
                    if (segments.length <= 1) {
                      segments = [];
                      let currentSegment = '';
                      const words = cleanText.split(' ');
                      
                      for (const word of words) {
                        if (currentSegment.length + word.length > 150) {
                          if (currentSegment.trim()) {
                            segments.push(currentSegment.trim());
                          }
                          currentSegment = word;
                        } else {
                          currentSegment += (currentSegment ? ' ' : '') + word;
                        }
                      }
                      
                      if (currentSegment.trim()) {
                        segments.push(currentSegment.trim());
                      }
                    }
                    
                    // 合并过短的段落
                    const finalSegments = [];
                    let currentParagraph = '';
                    
                    for (const segment of segments) {
                      const segmentText = segment.trim();
                      if (!segmentText) continue;
                      
                      if (currentParagraph.length + segmentText.length < 120) {
                        currentParagraph += (currentParagraph ? '。' : '') + segmentText;
                      } else {
                        if (currentParagraph) {
                          finalSegments.push(currentParagraph);
                        }
                        currentParagraph = segmentText;
                      }
                    }
                    
                    if (currentParagraph) {
                      finalSegments.push(currentParagraph);
                    }
                    
                    return finalSegments.slice(0, 4); // 最多显示4段
                  };
                  
                  const paragraphs = smartSplitText(formattedStory.summary);
                  
                  // 如果分段失败，使用原来的显示方式
                  if (!paragraphs || paragraphs.length === 0) {
                    return <p>{safeDisplayText(formattedStory.summary, 400)}</p>;
                  }
                  
                  // 显示段落
                  return paragraphs.map((paragraph, index) => (
                    <p key={index} className="summary-paragraph">
                      {paragraph.length > 200 ? paragraph.substring(0, 200) + '...' : paragraph}
                    </p>
                  ));
                })()}
              </div>
            </div>
            
            {/* AI智能分析 - 分析整个事件 */}
            <AINewsSummary 
              newsId={formattedStory.id} 
              news={formattedStory}
              isEvent={true}
            />
            
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
                <span className="stat-number">{formattedStory.commentCount || 0}</span>
                <span className="stat-label">评论数</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{formattedStory.tags.length}</span>
                <span className="stat-label">相关标签</span>
              </div>
            </div>
            {eventStats && lastStatsUpdate && (
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
                统计数据更新时间: {lastStatsUpdate.toLocaleTimeString('zh-CN')}
              </div>
            )}
            
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h2>新闻时间线</h2>
              {isLoggedIn && (
                <div className="follow-status-indicator">
                  <span className={`status-dot ${isFollowing ? 'following' : 'not-following'}`}></span>
                  <span className="status-text">
                    {isFollowing ? '已关注此事件' : '未关注'}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  fetchEventDetail(); // 同时刷新事件基本信息
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
                disabled={newsLoading || loading}
              >
                {(newsLoading || loading) ? '刷新中...' : '🔄 刷新数据'}
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    // 手动更新事件统计
                    const response = await fetch(`http://localhost:8080/api/v1/events/${id}/stats/update`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (response.ok) {
                      showNotification('事件统计已更新', 'success');
                      // 刷新所有数据
                      fetchEventDetail();
                      fetchEventNews();
                      fetchEventStats();
                    } else {
                      showNotification('更新统计失败，可能需要管理员权限', 'warning');
                    }
                  } catch (err) {
                    console.error('更新统计失败:', err);
                    showNotification('更新统计失败', 'error');
                  }
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                disabled={newsLoading || loading}
              >
                📊 更新统计
              </button>
            </div>
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
            <div className="news-count-info" style={{ marginLeft: '20px', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span>共找到 {filteredAndSortedNews.length} 条相关新闻</span>
              {lastNewsUpdate && (
                <span style={{ fontSize: '12px', opacity: '0.8' }}>
                  新闻更新时间: {lastNewsUpdate.toLocaleTimeString('zh-CN')}
                </span>
              )}
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
                <div key={news.id} className="timeline-news-item">
              <div className="timeline-news-marker">
                <span className="news-type-icon">{getNewsTypeIcon(news.type)}</span>
              </div>
              
                  <Link to={`/newspage/${news.id}`} className="news-card-link">
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
                        {news.title}
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
                    </div>
                  </Link>
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
      
      {/* 通知组件 */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'warning' && '⚠️'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDetailPage;