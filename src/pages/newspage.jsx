import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { safeDisplayText, safeDisplayTitle, splitIntoParagraphs } from '../utils/htmlUtils';
import { getCategoryNames } from '../utils/statusConfig';
import { newsApi } from '../api/newsApi';
import Header from "../components/Header";
import ThemeToggle from "../components/ThemeToggle";
import AINewsSummary from "../components/AINewsSummary";
import "./newspage.css";

export default function NewsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  
  // 点赞相关状态
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  
  // 筛选相关状态
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest'); // 'latest' 或 'hot'
  const [allCategories, setAllCategories] = useState([]);

  // 评论相关状态
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const COMMENTS_PAGE_SIZE = 5;
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 点赞相关状态
  const [likedCommentsLoading, setLikedCommentsLoading] = useState(new Set()); // 存储正在点赞的评论ID
  
  // 回复相关状态
  const [replyingTo, setReplyingTo] = useState(null); // 当前正在回复的评论ID
  const [replyInput, setReplyInput] = useState(""); // 回复输入内容

  // AI分析相关状态
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 分页相关计算
  const totalPages = Math.ceil(commentsTotal / COMMENTS_PAGE_SIZE);
  const hasNextPage = commentsPage < totalPages;
  const hasPrevPage = commentsPage > 1;

  // 格式化新闻数据，处理字段映射
  const formatNewsData = (rawData) => {
    if (!rawData) return null;
    
    return {
      ...rawData,
      // 处理字段映射
      readCount: rawData.view_count || 0,
      likeCount: rawData.like_count || 0,
      commentCount: rawData.comment_count || 0,
      tags: Array.isArray(rawData.tags) ? rawData.tags : (rawData.tags ? rawData.tags.split(',').map(tag => tag.trim()) : []),
      aiPrediction: rawData.ai_prediction || "暂无AI预测分析",
      // 格式化时间
      published_at: rawData.published_at ? new Date(rawData.published_at).toLocaleString('zh-CN') : '',
    };
  };

  // 格式化相关新闻数据
  const formatRelatedNews = (newsList) => {
    return newsList.map(news => ({
      ...news,
      published_at: news.published_at ? new Date(news.published_at).toLocaleString('zh-CN') : ''
    }));
  };

  // 获取当前用户ID
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8080/api/v1/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.code === 200 && res.data) setCurrentUserId(res.data.id);
        });
    }
  }, []);

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/news?limit=100`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.code === 200 && result.data) {
        // 提取所有分类并去重
        const categories = [...new Set(result.data.map(news => news.category).filter(Boolean))];
        setAllCategories(categories);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
      // 使用配置文件中的分类作为默认值
      setAllCategories(getCategoryNames());
    }
  };

  // 获取筛选后的新闻
  const fetchFilteredNews = async (newsId) => {
    try {
      setRelatedLoading(true);
      
      let endpoint = '';
      let queryParams = new URLSearchParams();
      
      // 根据分类和排序方式选择API端点
      if (selectedCategory !== 'all') {
        // 使用按分类筛选的API
        endpoint = `/category/${selectedCategory}`;
        queryParams.append('sort', sortBy);
        queryParams.append('limit', '20');
      } else {
        // 使用原有的热门或最新API
        if (sortBy === 'hot') {
          endpoint = '/hot';
        } else {
          endpoint = '/latest';
        }
        queryParams.append('limit', '20');
      }
      
      const response = await fetch(`http://localhost:8080/api/v1/news${endpoint}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.code === 200 && result.data) {
        // 过滤掉当前新闻
        const filtered = result.data.filter(news => news.id !== parseInt(newsId));
        
        const formattedRelated = formatRelatedNews(filtered.slice(0, 6));
        setRelatedNews(formattedRelated);
      }
    } catch (error) {
      console.error('获取筛选新闻失败:', error);
      setRelatedNews([]);
    } finally {
      setRelatedLoading(false);
    }
  };

  // 所属事件配置
  const eventConfig = {
    "AI技术发展": { label: "AI技术发展", bgColor: "rgba(59, 130, 246, 0.9)" },
    "气候变化会议": { label: "气候变化会议", bgColor: "rgba(16, 185, 129, 0.9)" },
    "新能源汽车发展": { label: "新能源汽车发展", bgColor: "rgba(245, 158, 11, 0.9)" },
  };

  useEffect(() => {
    // 从后端API获取新闻详情
    const fetchNewsData = async () => {
      try {
        setLoading(true);

        // 调用后端API获取新闻详情
        const response = await fetch(`http://localhost:8080/api/v1/news/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
         if (result.code === 200 && result.data) {
           const formattedData = formatNewsData(result.data);
           setNewsData(formattedData);
           setLikeCount(result.data.like_count || 0); // 设置点赞数
           setError(null);
           
           // 增加浏览量（异步调用，不影响页面加载）
           fetch(`http://localhost:8080/api/v1/news/${id}/view`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json'
             }
           }).catch(err => {
             console.log('记录浏览量失败:', err);
           });
         } else {
           throw new Error(result.message || '获取新闻详情失败');
         }
      } catch (error) {
        console.error('获取新闻详情失败:', error);
        setError("获取新闻详情失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
    fetchCategories(); // 获取分类列表
    fetchLikeStatus(); // 获取点赞状态
    // AI分析数据现在从AINewsSummary组件获取
  }, [id]);

  // 当筛选条件改变时重新获取相关新闻
  useEffect(() => {
    if (id) {
      fetchFilteredNews(id);
    }
  }, [selectedCategory, sortBy, id]);

  // 当新闻数据加载完成后，获取点赞状态并初始化点赞数
  useEffect(() => {
    if (newsData) {
      setLikeCount(newsData.like_count || 0);
      fetchLikeStatus();
    }
  }, [newsData?.id]);

  // 格式化时间显示
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  // 检查用户是否已登录
  const isLoggedIn = () => {
    return localStorage.getItem('token') !== null;
  };

  // 获取点赞状态
  const fetchLikeStatus = async () => {
    if (!isLoggedIn() || !id) return;
    
    try {
      const response = await newsApi.getLikeStatus(id);
      if (response.success) {
        setIsLiked(response.data.is_liked);
      }
    } catch (error) {
      console.log('获取点赞状态失败:', error);
    }
  };

  // AI分析数据现在通过AINewsSummary组件的回调获取

  // 处理点赞操作
  const handleLike = async () => {
    if (!isLoggedIn()) {
      alert('请先登录后再点赞');
      return;
    }

    if (likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      const response = await newsApi.likeNews(id);
      if (response.success) {
        setIsLiked(response.data.is_liked);
        setLikeCount(response.data.like_count);
        
        // 更新newsData中的点赞数
        setNewsData(prev => ({
          ...prev,
          like_count: response.data.like_count
        }));
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      alert('点赞操作失败，请稍后重试');
    } finally {
      setLikeLoading(false);
    }
  };



  // 格式化评论数据
  const formatComments = (commentsList) => {
    return commentsList.map(comment => ({
      ...comment,
      created_at: comment.created_at ? new Date(comment.created_at).toLocaleString('zh-CN') : '',
      // 确保保留 is_liked 字段
      is_liked: comment.is_liked || false,
      // 格式化回复数据
      replies: comment.replies ? comment.replies.map(reply => ({
        ...reply,
        created_at: reply.created_at ? new Date(reply.created_at).toLocaleString('zh-CN') : '',
        // 确保回复也保留 is_liked 字段
        is_liked: reply.is_liked || false
      })) : []
    }));
  };

  // 获取新闻评论，支持分页
  const fetchComments = async (newsId, page = 1) => {
    console.log(`fetchComments: newsId=${newsId}, page=${page}`);
    setCommentsLoading(true);
    try {
      const url = `http://localhost:8080/api/v1/comments/news/${newsId}?page=${page}&size=${COMMENTS_PAGE_SIZE}`;
      console.log(`请求URL: ${url}`);
      
      // 获取token，如果有的话添加到请求头中
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers
      });
      const result = await response.json();
      console.log(`API响应:`, result);
      
      if (result.code === 200 && Array.isArray(result.data)) {
        const formattedComments = formatComments(result.data);
        console.log(`格式化后的评论:`, formattedComments);

        // 使用后端返回的total字段
        setCommentsTotal(result.total || 0);
        setComments(formattedComments);
        console.log(`设置评论: 新评论数=${formattedComments.length}`);
      } else {
        console.log(`API返回错误或数据格式不正确:`, result);
        setComments([]);
        setCommentsTotal(0);
      }
    } catch (error) {
      console.error('获取评论失败:', error);
      setComments([]);
      setCommentsTotal(0);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 发表评论
  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      let url, headers, body;
      
      if (token) {
        // 已登录用户使用原有接口
        url = 'http://localhost:8080/api/v1/comments';
        headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        };
        body = JSON.stringify({ news_id: Number(id), content: commentInput.trim() });
      } else {
        // 未登录用户使用匿名评论接口
        url = 'http://localhost:8080/api/v1/comments/anonymous';
        headers = {
          'Content-Type': 'application/json'
        };
        body = JSON.stringify({ news_id: Number(id), content: commentInput.trim() });
      }
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body
      });
      const result = await res.json();
      if (result.code === 200) {
        setCommentInput('');
        setComments([]);
        setCommentsPage(1);
        fetchComments(id, 1);
      } else {
        alert(result.message || '评论失败');
      }
    } catch (_) {
      alert('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.code === 200) {
        setComments([]);
        setCommentsPage(1);
        fetchComments(id, 1);
      } else {
        alert(result.message || '删除失败');
      }
    } catch (_) {
      alert('删除失败');
    }
  };

  // 分页导航函数
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      console.log(`切换到第${newPage}页`);
      setCommentsPage(newPage);
      fetchComments(id, newPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      handlePageChange(commentsPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      handlePageChange(commentsPage + 1);
    }
  };

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // 最多显示5个页码
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数不多，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 如果总页数很多，显示当前页附近的页码
      let start = Math.max(1, commentsPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // 调整起始位置，确保显示maxVisiblePages个页码
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      // 添加第一页（如果不是连续的）
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...'); // 省略号
        }
      }
      
      // 添加中间页码
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // 添加最后一页（如果不是连续的）
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...'); // 省略号
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleFirstPage = () => {
    handlePageChange(1);
  };

  const handleLastPage = () => {
    handlePageChange(totalPages);
  };

  // 处理评论点赞
  const handleLikeComment = async (commentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('点赞需要先登录哦');
      return;
    }

    // 防止重复点击
    if (likedCommentsLoading.has(commentId)) {
      return;
    }

    // 找到当前评论，获取其点赞状态
    let targetComment = null;
    let isLiked = false;
    
    // 在顶级评论中查找
    for (const comment of comments) {
      if (comment.id === commentId) {
        targetComment = comment;
        isLiked = comment.is_liked;
        break;
      }
      // 在回复中查找
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (reply.id === commentId) {
            targetComment = reply;
            isLiked = reply.is_liked;
            break;
          }
        }
        if (targetComment) break;
      }
    }

    if (!targetComment) {
      console.error('未找到目标评论');
      return;
    }

    const endpoint = isLiked ? 'DELETE' : 'POST';
    
    // 添加调试信息
    console.log(`点赞操作: 评论ID=${commentId}, 当前状态=${isLiked ? '已点赞' : '未点赞'}, 请求方法=${endpoint}`);
    
    try {
      setLikedCommentsLoading(prev => new Set(prev).add(commentId));
      
      const url = `http://localhost:8080/api/v1/comments/${commentId}/like`;
      console.log(`发送请求到: ${url}`);
      
      const response = await fetch(url, {
        method: endpoint,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`响应状态: ${response.status}`);
      const result = await response.json();
      console.log(`响应数据:`, result);
      
      if (result.code === 200) {
        // 更新评论列表中的点赞数和状态
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              like_count: result.data.like_count,
              is_liked: result.data.is_liked
            };
          }
          // 检查是否是回复的点赞
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  like_count: result.data.like_count,
                  is_liked: result.data.is_liked
                };
              }
              return reply;
            });
            return {
              ...comment,
              replies: updatedReplies
            };
          }
          return comment;
        }));
        
        console.log(`点赞操作成功: ${isLiked ? '取消点赞' : '点赞'}`);
      } else {
        console.error(`点赞操作失败: ${result.message}`);
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setLikedCommentsLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  // 处理回复点击
  const handleReplyClick = (commentId) => {
    if (!currentUserId) {
      alert('回复需要先登录哦');
      return;
    }
    setReplyingTo(commentId);
    setReplyInput('');
  };

  // 处理提交回复
  const handleSubmitReply = async (commentId) => {
    if (!replyInput.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('回复需要先登录哦');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('http://localhost:8080/api/v1/comments/reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          news_id: parseInt(id),
          parent_id: commentId,
          content: replyInput.trim()
        })
      });

      const result = await response.json();
      
      if (result.code === 200) {
        // 回复成功，重新加载评论
        setReplyInput('');
        setReplyingTo(null);
        setComments([]);
        setCommentsPage(1);
        fetchComments(id, 1);
        alert('回复成功！');
      } else {
        alert(result.message || '回复失败');
      }
    } catch (error) {
      console.error('回复失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 首次加载和切换新闻时，重置评论
  useEffect(() => {
    setComments([]);
    setCommentsPage(1);
    fetchComments(id, 1);
  }, [id]);

  // 加载状态
  if (loading) {
    return (
      <div className="newspage-container">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载新闻详情...</p>
        </div>
        <ThemeToggle className="fixed" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="newspage-container">
        <Header />
        <div className="error-container">
          <h2>😔 加载失败</h2>
          <p>{error}</p>
          <button className="back-btn" onClick={() => window.history.back()}>
            返回上一页
          </button>
        </div>
        <ThemeToggle className="fixed" />
      </div>
    );
  }

  return (
    <div className="newspage-container">
      <Header />

      <div className="newspage-content">
        <div className="news-detail-grid">
          {/* 主要内容区域 */}
          <div className="main-content">
            {/* 新闻头部信息 */}
            <div className="content-card">
              <div className="news-header-section">
                <div className="news-tags">
                  <div className="news-category-badge">
                    {newsData.category}
                  </div>

                  {newsData.belonged_event && (
                    <div 
                      className="news-event-badge"
                      style={{
                        backgroundColor: eventConfig[newsData.belonged_event]?.bgColor || "rgba(107, 114, 128, 0.9)"
                      }}
                    >
                      {eventConfig[newsData.belonged_event]?.label || newsData.belonged_event}
                    </div>
                  )}
                </div>
                
                <h1 className="news-title">{safeDisplayTitle(newsData.title)}</h1>
                <p className="news-summary">{safeDisplayText(newsData.summary, 300)}</p>
                
                <div className="news-meta">
                  <span className="news-time">{formatTime(newsData.published_at)}</span>
                  <span className="news-source">{newsData.source}</span>
                  {newsData.author && <span className="news-author">作者: {newsData.author}</span>}
                </div>

                {/* 统计信息 */}
                <div className="news-stats">
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="stat-value">{newsData.view_count || 0}</span>
                    <span className="stat-label">阅读量</span>
                  </div>
                  {/* 可交互的点赞按钮 */}
                  <button 
                    className={`stat-item like-button ${isLiked ? 'liked' : ''} ${likeLoading ? 'loading' : ''}`}
                    onClick={handleLike}
                    disabled={likeLoading}
                    title={isLiked ? '取消点赞' : '点赞'}
                  >
                    <svg className="stat-icon" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="stat-value">{likeCount}</span>
                    <span className="stat-label">点赞数</span>
                  </button>
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="stat-value">{newsData.comment_count || 0}</span>
                    <span className="stat-label">评论数</span>
                  </div>
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span className="stat-value">{newsData.share_count || 0}</span>
                    <span className="stat-label">分享数</span>
                  </div>
                </div>

                {/* 热度分数 */}
                {newsData.hotness_score && (
                  <div className="hotness-score">
                    <span className="hotness-label">热度指数:</span>
                    <span className="hotness-value">{newsData.hotness_score.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI智能分析 */}
            <AINewsSummary 
              newsId={newsData.id} 
              news={newsData}
              isEvent={false}
              onAnalysisUpdate={(analysisData) => {
                console.log('📤 从AINewsSummary接收到分析数据:', analysisData);
                console.log('📤 AI关键词数据:', analysisData?.keywords);
                setAiAnalysis(analysisData);
              }}
            />

            {/* 新闻内容 */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📰 新闻内容</h2>
              </div>
              <div className="card-body">
                {/* 新闻图片 */}
                {newsData.image_url && (
                  <div className="news-image-container">
                    <img 
                      src={newsData.image_url} 
                      alt={newsData.title}
                      className="news-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="news-content">
                  {(() => {
                    // HTML内容格式化函数
                    const formatHtmlContent = (htmlContent) => {
                      if (!htmlContent) return [];
                      
                      // 创建临时DOM元素来解析HTML
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = htmlContent;
                      
                      const elements = [];
                      
                      // 递归处理DOM节点
                      const processNode = (node, index = 0) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                          const text = node.textContent.trim();
                          if (text) {
                            return (
                              <span key={`text-${index}`} className="news-text">
                                {text}
                              </span>
                            );
                          }
                          return null;
                        }
                        
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const tagName = node.tagName.toLowerCase();
                          const content = Array.from(node.childNodes).map((child, childIndex) => 
                            processNode(child, `${index}-${childIndex}`)
                          ).filter(Boolean);
                          
                          // 检查是否包含图片链接
                          const text = node.textContent || '';
                          const imageUrlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi;
                          const imageUrls = text.match(imageUrlRegex);
                          
                          switch (tagName) {
                            case 'h1':
                              return (
                                <h1 key={`h1-${index}`} className="news-heading-1">
                                  {content}
                                </h1>
                              );
                            case 'h2':
                              return (
                                <h2 key={`h2-${index}`} className="news-heading-2">
                                  {content}
                                </h2>
                              );
                            case 'h3':
                              return (
                                <h3 key={`h3-${index}`} className="news-heading-3">
                                  {content}
                                </h3>
                              );
                            case 'h4':
                              return (
                                <h4 key={`h4-${index}`} className="news-heading-4">
                                  {content}
                                </h4>
                              );
                            case 'p':
                              if (imageUrls && imageUrls.length > 0) {
                                return (
                                  <div key={`p-images-${index}`} className="paragraph-with-images">
                                    {imageUrls.map((imageUrl, imgIndex) => (
                                      <div key={imgIndex} className="embedded-image-container">
                                        <img 
                                          src={imageUrl.trim()} 
                                          alt={`新闻图片 ${imgIndex + 1}`}
                                          className="embedded-news-image"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                          }}
                                          onLoad={(e) => {
                                            e.target.style.display = 'block';
                                          }}
                                        />
                                      </div>
                                    ))}
                                    {text.replace(imageUrlRegex, '').trim() && (
                                      <p className="news-paragraph">
                                        {text.replace(imageUrlRegex, '').trim()}
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return (
                                <p key={`p-${index}`} className="news-paragraph">
                                  {content}
                                </p>
                              );
                            case 'ul':
                              return (
                                <ul key={`ul-${index}`} className="news-list">
                                  {content}
                                </ul>
                              );
                            case 'ol':
                              return (
                                <ol key={`ol-${index}`} className="news-ordered-list">
                                  {content}
                                </ol>
                              );
                            case 'li':
                              return (
                                <li key={`li-${index}`} className="news-list-item">
                                  {content}
                                </li>
                              );
                            case 'strong':
                            case 'b':
                              return (
                                <strong key={`strong-${index}`} className="news-bold">
                                  {content}
                                </strong>
                              );
                            case 'em':
                            case 'i':
                              return (
                                <em key={`em-${index}`} className="news-italic">
                                  {content}
                                </em>
                              );
                            case 'blockquote':
                              return (
                                <blockquote key={`quote-${index}`} className="news-blockquote">
                                  {content}
                                </blockquote>
                              );
                            case 'pre':
                              return (
                                <pre key={`pre-${index}`} className="news-preformatted">
                                  {content}
                                </pre>
                              );
                            case 'code':
                              return (
                                <code key={`code-${index}`} className="news-code">
                                  {content}
                                </code>
                              );
                            case 'br':
                              return <br key={`br-${index}`} />;
                            case 'hr':
                              return <hr key={`hr-${index}`} className="news-divider" />;
                            case 'div':
                              return (
                                <div key={`div-${index}`} className="news-section">
                                  {content}
                                </div>
                              );
                            default:
                              // 对于未知标签，返回内容但不包装
                              return content.length === 1 ? content[0] : (
                                <span key={`span-${index}`} className="news-text">
                                  {content}
                                </span>
                              );
                          }
                        }
                        
                        return null;
                      };
                      
                      // 处理所有子节点
                      Array.from(tempDiv.childNodes).forEach((node, index) => {
                        const element = processNode(node, index);
                        if (element) {
                          elements.push(element);
                        }
                      });
                      
                      return elements;
                    };
                    
                    // 如果内容包含HTML标签，使用HTML格式化
                    if (newsData.content && /<[^>]+>/.test(newsData.content)) {
                      return formatHtmlContent(newsData.content);
                    } else {
                      // 如果没有HTML标签，使用原来的段落分割方式
                      return splitIntoParagraphs(newsData.content).map((paragraph, index) => {
                        // 检查段落是否包含图片链接
                        const imageUrlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi;
                        const imageUrls = paragraph.match(imageUrlRegex);
                        
                        if (imageUrls && imageUrls.length > 0) {
                          return (
                            <div key={index} className="paragraph-with-images">
                              {imageUrls.map((imageUrl, imgIndex) => (
                                <div key={imgIndex} className="embedded-image-container">
                                  <img 
                                    src={imageUrl.trim()} 
                                    alt={`新闻图片 ${imgIndex + 1}`}
                                    className="embedded-news-image"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                    onLoad={(e) => {
                                      e.target.style.display = 'block';
                                    }}
                                  />
                                </div>
                              ))}
                              {paragraph.replace(imageUrlRegex, '').trim() && (
                                <p className="news-paragraph">
                                  {paragraph.replace(imageUrlRegex, '').trim()}
                                </p>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <p key={index} className="news-paragraph">
                              {paragraph}
                            </p>
                          );
                        }
                      });
                    }
                  })()}
                </div>
                
                {/* 标签区域 */}
                {(() => {
                  // 关键词处理和增强（优先使用AI分析的关键词）
                  const processKeywords = () => {
                    let keywords = [];
                    let dataSource = 'none';
                    
                    console.log('🎯 处理标签关键词:', { aiAnalysis: !!aiAnalysis, keywords: aiAnalysis?.keywords });
                    
                    // 优先使用AI分析的关键词
                    if (aiAnalysis && aiAnalysis.keywords) {
                      
                      if (Array.isArray(aiAnalysis.keywords)) {
                        // 直接检查并强制分割包含逗号的字符串
                        if (aiAnalysis.keywords.length === 1 && typeof aiAnalysis.keywords[0] === 'string') {
                          const firstElement = aiAnalysis.keywords[0];
                          // 检查是否包含中文逗号或英文逗号
                          if (firstElement.includes(',') || firstElement.includes('，')) {
                            // 分割字符串，支持中文和英文逗号
                            keywords = firstElement.split(/[,，]/).map(k => k.trim()).filter(k => k);
                            dataSource = 'ai-array-split';
                            console.log('✅ 成功分割AI关键词:', keywords);
                          } else {
                            keywords = aiAnalysis.keywords;
                            dataSource = 'ai-array';
                            console.log('❌ 未发现逗号，使用原始数组:', keywords);
                          }
                        } else {
                          keywords = aiAnalysis.keywords;
                          dataSource = 'ai-array';
                          console.log('❌ 数组长度不为1或非字符串，使用原始数组:', keywords);
                        }
                      } else if (typeof aiAnalysis.keywords === 'string') {
                        try {
                          keywords = JSON.parse(aiAnalysis.keywords);
                          dataSource = 'ai-json';
                        } catch {
                          // 如果是逗号分割的字符串
                          keywords = aiAnalysis.keywords.split(',').map(k => k.trim());
                          dataSource = 'ai-string';
                        }
                      }
                    } 
                    
                    // 如果没有AI关键词，使用新闻的tags作为备选
                    if (keywords.length === 0) {
                      if (newsData.tags && Array.isArray(newsData.tags)) {
                        keywords = newsData.tags;
                        dataSource = 'tags-array';
                      }
                      // 如果tags是字符串，尝试解析
                      else if (newsData.tags && typeof newsData.tags === 'string' && newsData.tags.trim()) {
                        try {
                          keywords = JSON.parse(newsData.tags);
                          dataSource = 'tags-json';
                        } catch {
                          // 如果解析失败，按逗号分割
                          keywords = newsData.tags.split(',').map(tag => tag.trim());
                          dataSource = 'tags-string';
                        }
                      }
                    }
                    
                    console.log(`📍 关键词来源: ${dataSource}, 数量: ${keywords.length}`);
                    
                    if (!keywords || keywords.length === 0) return [];
                    
                    // 清理和过滤关键词
                    const cleanKeywords = keywords
                      .map(keyword => {
                        // 处理各种数据类型
                        if (typeof keyword === 'string') {
                          return keyword.trim();
                        } else if (typeof keyword === 'object' && keyword !== null) {
                          // 如果是对象，尝试获取name或text字段
                          return keyword.name || keyword.text || keyword.value || String(keyword).trim();
                        } else {
                          return String(keyword).trim();
                        }
                      })
                      .filter(keyword => keyword && keyword.length > 0 && keyword.length <= 20 && keyword !== '[]' && keyword !== '{}') // 过滤空关键词、过长关键词和无效数据
                      .slice(0, 12); // 最多显示12个关键词
                    

                    
                    // 如果仍然没有有效关键词，尝试从新闻数据中提取
                    if (cleanKeywords.length === 0) {
                      // 使用新闻分类作为关键词
                      if (newsData.category) {
                        cleanKeywords.push(newsData.category);
                        dataSource = 'category';
                      }
                      // 如果有来源，也可以作为标签
                      if (newsData.source && cleanKeywords.length < 3) {
                        cleanKeywords.push(newsData.source);
                        dataSource = dataSource === 'category' ? 'category+source' : 'source';
                      }
                      
                      // 最终回退：如果还是没有关键词，添加一些基础标签
                      if (cleanKeywords.length === 0) {
                        cleanKeywords.push('新闻');
                        if (newsData.published_at) {
                          const date = new Date(newsData.published_at);
                          const today = new Date();
                          const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                          if (diffDays === 0) {
                            cleanKeywords.push('今日新闻');
                          } else if (diffDays <= 7) {
                            cleanKeywords.push('本周新闻');
                          }
                        }
                        dataSource = 'fallback';
                      }
                    }
                    
                    console.log('✅ 最终标签:', cleanKeywords);
                    
                    // 为关键词添加颜色主题
                    const tagColors = [
                      'blue', 'green', 'purple', 'orange', 'red', 'pink',
                      'indigo', 'teal', 'cyan', 'emerald', 'violet', 'amber'
                    ];
                    
                    return cleanKeywords.map((keyword, index) => ({
                      name: keyword,
                      color: tagColors[index % tagColors.length],
                      id: `keyword-${index}-${keyword.toLowerCase().replace(/\s+/g, '-')}`,
                      source: dataSource
                    }));
                  };

                  // 处理关键词点击事件
                  const handleKeywordClick = (keywordName) => {
                    // 在新标签页中打开关键词搜索
                    const searchUrl = `/search?q=${encodeURIComponent(keywordName)}&type=keywords`;
                    window.open(searchUrl, '_blank');
                  };

                  const processedKeywords = processKeywords();
                  
                  // 临时调试：显示当前状态
                  console.log('🔍 标签渲染时的状态:', {
                    aiAnalysis: aiAnalysis,
                    hasKeywords: !!(aiAnalysis && aiAnalysis.keywords),
                    keywordsData: aiAnalysis?.keywords,
                    processedKeywords: processedKeywords
                  });

                  return processedKeywords.length > 0 && (
                    <div className="news-tags-section">
                      <div className="tags-header">
                        <div className="tags-title">
                          <svg className="tags-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="tags-label">
                            {processedKeywords.some(k => k.source?.startsWith('ai')) ? 'AI提取关键词' : '相关标签'}
                          </span>
                          <span className="tags-count">({processedKeywords.length})</span>
                          {processedKeywords.some(k => k.source?.startsWith('ai')) && (
                            <span className="ai-badge">🤖</span>
                          )}
                        </div>
                        {processedKeywords.length > 6 && (
                          <button 
                            className="tags-show-all"
                            onClick={() => {
                              const container = document.querySelector('.tags-container');
                              container.classList.toggle('show-all');
                              const btn = document.querySelector('.tags-show-all');
                              btn.textContent = container.classList.contains('show-all') ? '收起' : '查看全部';
                            }}
                          >
                            查看全部
                          </button>
                        )}
                      </div>
                      <div className="tags-container">
                        {processedKeywords.map((keyword, index) => (
                          <button
                            key={keyword.id}
                            className={`enhanced-tag tag-${keyword.color}`}
                            onClick={() => handleKeywordClick(keyword.name)}
                            title={`点击搜索"${keyword.name}"相关新闻`}
                            style={{
                              animationDelay: `${index * 0.1}s`
                            }}
                          >
                            <span className="tag-icon">
                              {keyword.source?.startsWith('ai') ? '🎯' : '🏷️'}
                            </span>
                            <span className="tag-text">{keyword.name}</span>
                            <span className="tag-hover-effect">
                              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </span>
                          </button>
                        ))}
                      </div>
                      
                      {/* 关键词统计信息 */}
                      <div className="tags-stats">
                        <div className="tags-info">
                          <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {aiAnalysis && aiAnalysis.keywords 
                              ? '点击AI关键词可搜索相关新闻' 
                              : '点击标签可搜索相关新闻'
                            }
                          </span>
                          {aiLoading && (
                            <span className="ai-loading"> • AI分析中...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>


          </div>

          {/* 侧边栏 */}
          <div className="sidebar">

            {/* 相关新闻 */}
            <div className="sidebar-card">
              <h3 className="card-title">相关新闻</h3>
              
              {/* 筛选控件 */}
              <div className="news-filters">
                {/* 排序方式 */}
                <div className="filter-group">
                  <label className="filter-label">排序方式</label>
                  <div className="filter-buttons">
                    <button 
                      className={`filter-btn ${sortBy === 'latest' ? 'active' : ''}`}
                      onClick={() => setSortBy('latest')}
                    >
                      最新发布
                    </button>
                    <button 
                      className={`filter-btn ${sortBy === 'hot' ? 'active' : ''}`}
                      onClick={() => setSortBy('hot')}
                    >
                      热度最高
                    </button>
                  </div>
                </div>

                {/* 分类筛选 */}
                <div className="filter-group">
                  <label className="filter-label">新闻分类</label>
                  <select 
                    className="filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">全部分类</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="related-news-list">
                {relatedLoading ? (
                  <div className="loading-container">
                    <p>正在加载相关新闻...</p>
                  </div>
                ) : relatedNews.length > 0 ? (
                  relatedNews.map((news) => (
                    <div key={news.id} className="related-news-item" onClick={() => window.location.href = `/newspage/${news.id}`}>
                      <div className="related-news-header">
                        <div className="related-news-category">{news.category}</div>
                        <span className="related-news-time">{news.published_at}</span>
                      </div>
                      <h4 className="related-news-title">{safeDisplayTitle(news.title)}</h4>
                      <p className="related-news-summary">{safeDisplayText(news.summary, 100)}</p>
                      <div className="related-news-source">{news.source}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-related-news">
                    <p>暂无相关新闻</p>
                  </div>
                )}
              </div>
            </div>

            {/* 热门评论 */}
            <div className="sidebar-card">
              <h3 className="card-title">💬 热门评论 ({commentsTotal})</h3>
              {/* 评论输入框 */}
              <div className="comment-input-row">
                <input
                  className="comment-input"
                  placeholder={currentUserId ? "哎呦，不错哦，发条评论吧" : "未登录用户也可以发表评论哦"}
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  maxLength={1000}
                  disabled={submitting}
                />
                <button
                  className="comment-submit-btn"
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentInput.trim()}
                >
                  {currentUserId ? "发布" : "匿名发布"}
                </button>
              </div>
              <div className="comments-list">
                {commentsLoading ? (
                  <div className="loading-container"><p>正在加载评论...</p></div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className={`comment-avatar ${comment.is_anonymous ? 'anonymous' : ''}`}>
                        {comment.is_anonymous ? '匿' : '用'}
                      </div>
                      <div className="comment-content">
                        <div className={`comment-author ${comment.is_anonymous ? 'anonymous' : ''}`}>
                          {comment.is_anonymous ? '未命名用户' : (comment.username || `用户 ${comment.user_id}`)}
                        </div>
                        <div className="comment-text">{comment.content}</div>
                        
                        {/* 回复列表 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="replies-container">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="reply-item">
                                <div className={`reply-avatar ${reply.is_anonymous ? 'anonymous' : ''}`}>
                                  {reply.is_anonymous ? '匿' : '用'}
                                </div>
                                <div className="reply-content">
                                  <div className={`reply-author ${reply.is_anonymous ? 'anonymous' : ''}`}>
                                    {reply.is_anonymous ? '未命名用户' : (reply.username || `用户 ${reply.user_id}`)}
                                  </div>
                                  <div className="reply-text">{reply.content}</div>
                                  <div className="reply-footer">
                                    <div className="reply-time">{reply.created_at}</div>
                                    <div className="reply-actions">
                                      {/* 回复的点赞按钮 */}
                                      <button
                                        className={`reply-like-btn ${reply.is_liked ? 'liked' : ''} ${likedCommentsLoading.has(reply.id) ? 'loading' : ''}`}
                                        onClick={() => handleLikeComment(reply.id)}
                                        disabled={likedCommentsLoading.has(reply.id)}
                                      >
                                        <svg 
                                          className="like-icon" 
                                          fill={reply.is_liked ? "currentColor" : "none"} 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={reply.is_liked ? "0" : "2"} 
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                          />
                                        </svg>
                                        <span className="like-count">{reply.like_count || 0}</span>
                                      </button>
                                      
                                      {/* 回复的删除按钮 */}
                                      {!reply.is_anonymous && currentUserId === reply.user_id && (
                                        <div className="reply-delete-actions">
                                          <span
                                            className="reply-action-dot"
                                            onClick={() => {
                                              setDeleteTargetId(reply.id);
                                              setShowDeleteConfirm(true);
                                            }}
                                          >···</span>
                                          {showDeleteConfirm && deleteTargetId === reply.id && (
                                            <div className="reply-delete-confirm">
                                              <span
                                                className="reply-delete-btn"
                                                onClick={() => {
                                                  setShowDeleteConfirm(false);
                                                  handleDeleteComment(reply.id);
                                                }}
                                              >删除</span>
                                              <span
                                                className="reply-cancel-btn"
                                                onClick={() => setShowDeleteConfirm(false)}
                                              >取消</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* 回复输入框 */}
                        {replyingTo === comment.id && (
                          <div className="reply-input-container">
                            <input
                              className="reply-input"
                              placeholder="写下你的回复..."
                              value={replyInput}
                              onChange={e => setReplyInput(e.target.value)}
                              maxLength={1000}
                              disabled={submitting}
                            />
                            <div className="reply-actions">
                              <button
                                className="reply-submit-btn"
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={submitting || !replyInput.trim()}
                              >
                                回复
                              </button>
                              <button
                                className="reply-cancel-btn"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyInput('');
                                }}
                                disabled={submitting}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="comment-footer">
                          <div className="comment-time">{comment.created_at}</div>
                          <div className="comment-actions">
                            {/* 点赞按钮 */}
                            <button
                              className={`comment-like-btn ${comment.is_liked ? 'liked' : ''} ${likedCommentsLoading.has(comment.id) ? 'loading' : ''}`}
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={likedCommentsLoading.has(comment.id)}
                            >
                              <svg 
                                className="like-icon" 
                                fill={comment.is_liked ? "currentColor" : "none"} 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={comment.is_liked ? "0" : "2"} 
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                />
                              </svg>
                              <span className="like-count">{comment.like_count || 0}</span>
                            </button>
                            
                            {/* 回复按钮 */}
                            <button
                              className="comment-reply-btn"
                              onClick={() => handleReplyClick(comment.id)}
                            >
                              回复
                            </button>
                            
                            {/* 删除按钮，仅显示在自己评论右侧，匿名评论不能删除 */}
                            {!comment.is_anonymous && currentUserId === comment.user_id && (
                              <div className="comment-delete-actions">
                                <span
                                  className="comment-action-dot"
                                  onClick={() => {
                                    setDeleteTargetId(comment.id);
                                    setShowDeleteConfirm(true);
                                  }}
                                >···</span>
                                {showDeleteConfirm && deleteTargetId === comment.id && (
                                  <div className="comment-delete-confirm">
                                    <span
                                      className="comment-delete-btn"
                                      onClick={() => {
                                        setShowDeleteConfirm(false);
                                        handleDeleteComment(comment.id);
                                      }}
                                    >删除</span>
                                    <span
                                      className="comment-cancel-btn"
                                      onClick={() => setShowDeleteConfirm(false)}
                                    >取消</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments"><p>暂无评论</p></div>
                )}
              </div>
              {/* 分页组件 */}
              {totalPages > 1 && (
                <div className="comments-pagination">
                  <div className="pagination-info">
                    第 {commentsPage} 页，共 {totalPages} 页 ({commentsTotal} 条评论)
                    {commentsLoading && <span className="loading-indicator"> 加载中...</span>}
                  </div>
                  <div className="pagination-controls">
                    {/* 第一页按钮 */}
                    <button
                      className={`pagination-btn first-btn ${commentsPage === 1 ? 'disabled' : ''}`}
                      onClick={handleFirstPage}
                      disabled={commentsPage === 1}
                      title="第一页"
                    >
                      <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* 上一页按钮 */}
                    <button
                      className={`pagination-btn prev-btn ${!hasPrevPage ? 'disabled' : ''}`}
                      onClick={handlePrevPage}
                      disabled={!hasPrevPage}
                    >
                      <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      上一页
                    </button>
                    
                    {/* 页码按钮 */}
                    <div className="page-numbers">
                      {getPageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
                        ) : (
                          <button
                            key={pageNum}
                            className={`page-number ${pageNum === commentsPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        )
                      ))}
                    </div>
                    
                    {/* 下一页按钮 */}
                    <button
                      className={`pagination-btn next-btn ${!hasNextPage ? 'disabled' : ''}`}
                      onClick={handleNextPage}
                      disabled={!hasNextPage}
                    >
                      下一页
                      <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* 最后一页按钮 */}
                    <button
                      className={`pagination-btn last-btn ${commentsPage === totalPages ? 'disabled' : ''}`}
                      onClick={handleLastPage}
                      disabled={commentsPage === totalPages}
                      title="最后一页"
                    >
                      <svg className="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 浮动按钮组 */}
      <ThemeToggle className="fixed" />
    </div>
  );
}