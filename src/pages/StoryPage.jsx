import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import ThemeToggle from '../components/ThemeToggle';
import { getStatusColor, getStatusText, getImportanceColor, getImportanceText } from '../utils/statusConfig';
import './StoryPage.css';

export default function StoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [storiesPerPage] = useState(4); // 每页显示4个故事

  // 模拟故事数据
  const stories = [
    {
      id: 1,
      title: 'AI技术发展',
      description: '人工智能技术快速发展，各大科技公司竞相布局，从ChatGPT到各种AI应用的爆发式增长',
      category: '科技',
      newsCount: 15,
      startDate: '2023-11-01',
      lastUpdate: '2024-01-15',
      status: 'ongoing',
      importance: 'high',
      tags: ['人工智能', 'ChatGPT', '科技竞争'],
      thumbnail: '🤖',
      timeline: [
        { date: '2023-11-01', event: 'ChatGPT发布引发AI热潮' },
        { date: '2023-12-15', event: 'Google发布Bard竞争产品' },
        { date: '2024-01-10', event: 'OpenAI发布GPT-5预告' },
        { date: '2024-01-15', event: '微软宣布新投资计划' }
      ]
    },
    {
      id: 2,
      title: '全球气候变化会议',
      description: '联合国气候变化大会召开，各国就减排目标和气候资金达成重要共识',
      category: '环境',
      newsCount: 12,
      startDate: '2023-11-30',
      lastUpdate: '2024-01-14',
      status: 'ended',
      importance: 'high',
      tags: ['气候变化', '联合国', '环保政策'],
      thumbnail: '🌍',
      timeline: [
        { date: '2023-11-30', event: 'COP28气候大会开幕' },
        { date: '2023-12-05', event: '各国提交减排承诺' },
        { date: '2023-12-12', event: '达成历史性协议' },
        { date: '2024-01-14', event: '后续政策实施进展' }
      ]
    },
    {
      id: 3,
      title: '新能源汽车市场变革',
      description: '电动汽车市场快速发展，传统车企加速转型，新能源技术不断突破',
      category: '汽车',
      newsCount: 18,
      startDate: '2023-10-01',
      lastUpdate: '2024-01-13',
      status: 'ongoing',
      importance: 'medium',
      tags: ['电动汽车', '新能源', '汽车产业'],
      thumbnail: '🚗',
      timeline: [
        { date: '2023-10-01', event: '特斯拉降价引发市场震动' },
        { date: '2023-11-15', event: '比亚迪销量超越特斯拉' },
        { date: '2023-12-20', event: '传统车企发布电动化战略' },
        { date: '2024-01-13', event: '新能源车补贴政策调整' }
      ]
    },
    {
      id: 4,
      title: '太空探索新进展',
      description: '人类太空探索迎来新突破，商业航天快速发展，火星探索计划推进',
      category: '科学',
      newsCount: 8,
      startDate: '2023-09-01',
      lastUpdate: '2024-01-12',
      status: 'ongoing',
      importance: 'medium',
      tags: ['太空探索', '火星', '商业航天'],
      thumbnail: '🚀',
      timeline: [
        { date: '2023-09-01', event: 'SpaceX成功发射星舰' },
        { date: '2023-10-15', event: '中国空间站完成扩建' },
        { date: '2023-12-01', event: '火星探测器发现新证据' },
        { date: '2024-01-12', event: '商业太空旅游项目启动' }
      ]
    },
    {
      id: 5,
      title: '全球经济复苏趋势',
      description: '后疫情时代全球经济逐步复苏，各国政策调整，通胀压力缓解',
      category: '经济',
      newsCount: 22,
      startDate: '2023-08-01',
      lastUpdate: '2024-01-11',
      status: 'ongoing',
      importance: 'high',
      tags: ['经济复苏', '通胀', '货币政策'],
      thumbnail: '📈',
      timeline: [
        { date: '2023-08-01', event: '美联储暂停加息' },
        { date: '2023-09-15', event: '中国经济数据向好' },
        { date: '2023-11-20', event: '欧洲经济复苏迹象明显' },
        { date: '2024-01-11', event: '全球贸易量回升' }
      ]
    },
    {
      id: 6,
      title: '奥运会筹备进展',
      description: '2024巴黎奥运会筹备工作进入最后阶段，各项设施建设完善',
      category: '体育',
      newsCount: 10,
      startDate: '2023-07-01',
      lastUpdate: '2024-01-10',
      status: 'ongoing',
      importance: 'medium',
      tags: ['奥运会', '巴黎', '体育赛事'],
      thumbnail: '🏅',
      timeline: [
        { date: '2023-07-01', event: '奥运村建设完工' },
        { date: '2023-09-01', event: '门票销售启动' },
        { date: '2023-12-01', event: '火炬传递路线公布' },
        { date: '2024-01-10', event: '安保方案最终确定' }
      ]
    }
  ];

  const categories = ['all', '科技', '环境', '汽车', '科学', '经济', '体育'];
  const categoryLabels = {
    'all': '全部',
    '科技': '科技',
    '环境': '环境',
    '汽车': '汽车',
    '科学': '科学',
    '经济': '经济',
    '体育': '体育'
  };

  // 过滤和排序故事
  const filteredStories = stories
    .filter(story => {
      const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           story.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.lastUpdate) - new Date(a.lastUpdate);
        case 'oldest':
          return new Date(a.startDate) - new Date(b.startDate);
        case 'newsCount':
          return b.newsCount - a.newsCount;
        case 'importance': {
          const importanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return importanceOrder[b.importance] - importanceOrder[a.importance];
        }
        default:
          return 0;
      }
    });

  // 分页逻辑
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage);
  const startIndex = (currentPage - 1) * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;
  const currentStories = filteredStories.slice(startIndex, endIndex);

  // 分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 当筛选条件改变时重置到第一页
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);



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
                <option value="newsCount">新闻数量</option>
                <option value="importance">重要程度</option>
              </select>
            </div>
          </div>
        </div>

        {/* 故事时间线 */}
        <div className="timeline-container">
          <div className="timeline-line"></div>
          
          {currentStories.map((story, index) => (
            <div key={story.id} className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}>
              <div className="timeline-marker">
                <span className="timeline-icon">{story.thumbnail}</span>
              </div>
              
              <div className="story-card">
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
                  <span className="timeline-count">⏰ {story.timeline.length} 个时间点</span>
                </div>

                <div className="story-tags">
                  {story.tags.map(tag => (
                    <span key={tag} className="story-tag">#{tag}</span>
                  ))}
                </div>

                <div className="story-preview-timeline">
                  <h4>关键时间点预览：</h4>
                  <div className="mini-timeline">
                    {story.timeline.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="mini-timeline-item">
                        <span className="mini-date">{event.date}</span>
                        <span className="mini-event">{event.event}</span>
                      </div>
                    ))}
                    {story.timeline.length > 3 && (
                      <div className="mini-timeline-more">
                        +{story.timeline.length - 3} 更多事件
                      </div>
                    )}
                  </div>
                </div>

                <div className="story-actions">
                  <Link to={`/story/${story.id}`} className="view-story-btn">
                    查看完整故事 →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="no-results">
            <h3>未找到匹配的故事</h3>
            <p>尝试调整搜索关键词或筛选条件</p>
          </div>
        )}

        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>共 {filteredStories.length} 个故事，第 {currentPage} / {totalPages} 页</span>
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
}