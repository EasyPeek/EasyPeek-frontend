import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import ThemeToggle from "../components/ThemeToggle";
import "./newspage.css";

export default function NewsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsData, setNewsData] = useState(null);

  // 模拟新闻详情数据
  const mockNewsData = {
    id: 1,
    title: "科技巨头AI竞赛白热化，行业格局面临重大变革",
    content: "OpenAI、Google、微软等科技巨头在人工智能领域展开激烈竞争，新产品发布频繁，投资规模不断扩大。这场竞争不仅涉及技术突破，更关系到未来科技行业的主导权。各大公司纷纷加大投入，从人才争夺到技术研发，竞争日趋白热化。",
    summary: "OpenAI、Google、微软等科技巨头在人工智能领域展开激烈竞争，新产品发布频繁，投资规模不断扩大。",
    source: "科技日报",
    category: "科技",
    published_at: "2024-01-15 10:30",
    created_by: 1,
    is_active: true,
    belonged_event: "AI技术发展",
    readCount: 15420,
    likeCount: 892,
    commentCount: 156,
    followCount: 1234,
    tags: ["人工智能", "科技", "竞争", "创新"],
    aiPrediction: "根据AI分析，该事件后续可能出现更多合作与并购，预计影响持续3-6个月",
  };

  // 事件时间线数据
  const timeline = [
    {
      date: "2024-01-10",
      time: "09:00",
      title: "OpenAI发布GPT-5预告",
      content: "OpenAI在开发者大会上首次展示GPT-5的部分能力，引发行业关注",
      importance: "high",
      sources: ["TechCrunch", "The Verge"],
    },
    {
      date: "2024-01-12",
      time: "14:30",
      title: "Google回应竞争压力",
      content: "Google CEO在内部会议中表示将加大AI投入，Bard团队扩招50%",
      importance: "medium",
      sources: ["Reuters", "Bloomberg"],
    },
    {
      date: "2024-01-13",
      time: "16:45",
      title: "微软宣布新投资计划",
      content: "微软宣布向OpenAI追加投资100亿美元，深化战略合作关系",
      importance: "high",
      sources: ["WSJ", "Financial Times"],
    },
    {
      date: "2024-01-14",
      time: "11:20",
      title: "Meta推出Llama 3",
      content: "Meta正式发布Llama 3大语言模型，声称在多项基准测试中超越竞品",
      importance: "high",
      sources: ["Meta官方", "AI News"],
    },
    {
      date: "2024-01-15",
      time: "10:30",
      title: "行业分析师发声",
      content: "多位行业分析师认为AI竞赛进入白热化阶段，预计将重塑科技行业格局",
      importance: "medium",
      sources: ["McKinsey", "Gartner"],
    },
  ];

  // 相关新闻数据
  const relatedNews = [
    { 
      id: 2, 
      title: "AI芯片需求激增，英伟达股价创新高", 
      category: "科技",
      source: "财经网",
      published_at: "2024-01-14 15:30",
      summary: "AI芯片市场需求激增，英伟达股价创历史新高"
    },
    { 
      id: 3, 
      title: "欧盟AI法案正式生效，科技公司面临新挑战", 
      category: "政策",
      source: "环球时报",
      published_at: "2024-01-13 12:20",
      summary: "欧盟AI监管法案正式生效，对科技公司提出新的合规要求"
    },
    { 
      id: 4, 
      title: "中国AI企业加速出海，寻求国际合作", 
      category: "商业",
      source: "经济观察报",
      published_at: "2024-01-12 09:15",
      summary: "中国AI企业积极拓展海外市场，寻求更多国际合作机会"
    },
  ];

  // 所属事件配置
  const eventConfig = {
    "AI技术发展": { label: "AI技术发展", bgColor: "rgba(59, 130, 246, 0.9)" },
    "气候变化会议": { label: "气候变化会议", bgColor: "rgba(16, 185, 129, 0.9)" },
    "新能源汽车发展": { label: "新能源汽车发展", bgColor: "rgba(245, 158, 11, 0.9)" },
  };

  useEffect(() => {
    // 模拟API调用
    const fetchNewsData = async () => {
      try {
        setLoading(true);
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 根据ID获取对应的新闻数据
        const data = { ...mockNewsData, id: parseInt(id) };
        setNewsData(data);
        setError(null);
      } catch (error) {
        setError("获取新闻详情失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
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
                  <div 
                    className="news-event-badge"
                    style={{
                      backgroundColor: eventConfig[newsData.belonged_event]?.bgColor
                    }}
                  >
                    {eventConfig[newsData.belonged_event]?.label}
                  </div>
                </div>
                
                <h1 className="news-title">{newsData.title}</h1>
                <p className="news-summary">{newsData.summary}</p>
                
                <div className="news-meta">
                  <span className="news-time">{newsData.published_at}</span>
                  <span className="news-source">{newsData.source}</span>
                </div>

                {/* 统计信息 */}
                <div className="news-stats">
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="stat-value">{newsData.readCount}</span>
                    <span className="stat-label">阅读量</span>
                  </div>
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="stat-value">{newsData.likeCount}</span>
                    <span className="stat-label">点赞数</span>
                  </div>
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="stat-value">{newsData.commentCount}</span>
                    <span className="stat-label">评论数</span>
                  </div>
                  <div className="stat-item">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="stat-value">{newsData.followCount}</span>
                    <span className="stat-label">关注数</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI预测 */}
            <div className="content-card ai-prediction-card">
              <div className="card-header">
                <h2 className="card-title">🤖 AI趋势预测</h2>
              </div>
              <div className="card-body">
                <p className="ai-prediction-text">{newsData.aiPrediction}</p>
              </div>
            </div>

            {/* 新闻内容 */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📰 新闻内容</h2>
              </div>
              <div className="card-body">
                <div className="news-content">
                  {newsData.content}
                </div>
                
                {/* 标签区域 */}
                <div className="news-tags-section">
                  <span className="tags-label">相关标签：</span>
                  <div className="tags-container">
                    {newsData.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 事件时间线 */}
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📅 事件时间线</h2>
                <p className="card-subtitle">完整追踪事件发展过程</p>
              </div>
              <div className="card-body">
                <div className="timeline-container">
                  {timeline.map((event, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-connector">
                        <div className="timeline-dot">
                          {index + 1}
                        </div>
                        {index !== timeline.length - 1 && (
                          <div className="timeline-line"></div>
                        )}
                      </div>
                      
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-date">{event.date} {event.time}</span>
                          <span className={`timeline-importance ${event.importance}`}>
                            {event.importance === "high" ? "重要" : "一般"}
                          </span>
                        </div>
                        
                        <h4 className="timeline-title">{event.title}</h4>
                        <p className="timeline-description">{event.content}</p>
                        
                        <div className="timeline-sources">
                          <span className="sources-label">消息来源：</span>
                          <div className="sources-tags">
                            {event.sources.map((source, idx) => (
                              <span key={idx} className="source-tag">{source}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="sidebar">
            {/* 关注按钮 */}
            <div className="sidebar-card">
              <div className="follow-section">
                <button className="follow-btn">
                  👥 关注此事件 ({newsData.followCount})
                </button>
                <p className="follow-desc">关注后将收到事件后续发展提醒</p>
              </div>
            </div>

            {/* 相关新闻 */}
            <div className="sidebar-card">
              <h3 className="card-title">相关新闻</h3>
              <div className="related-news-list">
                {relatedNews.map((news) => (
                  <div key={news.id} className="related-news-item" onClick={() => window.location.href = `/newspage/${news.id}`}>
                    <div className="related-news-header">
                      <div className="related-news-category">{news.category}</div>
                      <span className="related-news-time">{news.published_at}</span>
                    </div>
                    <h4 className="related-news-title">{news.title}</h4>
                    <p className="related-news-summary">{news.summary}</p>
                    <div className="related-news-source">{news.source}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 热门评论 */}
            <div className="sidebar-card">
              <h3 className="card-title">💬 热门评论 ({newsData.commentCount})</h3>
              <div className="comments-list">
                <div className="comment-item">
                  <div className="comment-avatar">用</div>
                  <div className="comment-content">
                    <div className="comment-author">用户123</div>
                    <div className="comment-text">AI竞争确实激烈，期待看到更多创新产品</div>
                    <div className="comment-time">2小时前</div>
                  </div>
                </div>
                
                <div className="comment-item">
                  <div className="comment-avatar">科</div>
                  <div className="comment-content">
                    <div className="comment-author">科技观察者</div>
                    <div className="comment-text">这轮竞争对消费者来说是好事</div>
                    <div className="comment-time">3小时前</div>
                  </div>
                </div>
              </div>
              
              <button className="view-all-comments-btn">
                查看全部评论
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 浮动按钮组 */}
      <ThemeToggle className="fixed" />
    </div>
  );
}