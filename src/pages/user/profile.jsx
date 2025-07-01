import React, { useState } from 'react';
import { useParams, Link } from "react-router-dom";
import Header from '../../components/Header';
import ThemeToggle from '../../components/ThemeToggle';
import './profile.css';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('info');

  const userInfo = {
    name: "张三",
    email: "zhangsan@example.com",
    phone: "138****8888",
    location: "北京市",
    joinDate: "2023-06-15",
    bio: "关注科技和商业动态，喜欢深度分析",
    avatar: "/placeholder.svg?height=100&width=100",
  };

  const followedNews = [
    {
      id: 1,
      title: "科技巨头AI竞赛有新进展",
      category: "科技",
      lastUpdate: "2小时前",
      status: "进行中",
    },
    {
      id: 2,
      title: "全球气候变化新进展",
      category: "环境",
      lastUpdate: "1天前",
      status: "已完结",
    },
    {
      id: 3,
      title: "新能源汽车市场变革",
      category: "汽车",
      lastUpdate: "3小时前",
      status: "进行中",
    },
  ];

  const messages = [
    {
      id: 1,
      title: "您关注的科技巨头AI竞赛有新进展",
      content: "微软宣布向OpenAI追加投资100亿美元",
      time: "2小时前",
      read: false,
    },
    {
      id: 2,
      title: "系统通知",
      content: "您的账户安全设置已更新",
      time: "1天前",
      read: true,
    },
    {
      id: 3,
      title: "您关注的新能源汽车有新动态",
      content: "特斯拉发布新款Model Y",
      time: "2天前",
      read: true,
    },
  ];

  const tabs = [
    { id: 'info', label: '个人信息', icon: '👤' },
    { id: 'messages', label: '我的消息', icon: '🔔' },
    { id: 'following', label: '我的关注', icon: '❤️' },
    { id: 'preferences', label: '偏好设置', icon: '⚙️' },
    { id: 'settings', label: '系统设置', icon: '🔧' },
  ];

  return (
    <div className="profile-container">
      <Header />
      <ThemeToggle className="fixed" />
      
      <div className="profile-content">
        <div className="profile-grid">
          {/* 侧边栏 */}
          <div className="profile-sidebar">
            <div className="sidebar-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <img src={userInfo.avatar || "/placeholder.svg"} alt="头像" />
                </div>
                <h3 className="profile-name">{userInfo.name}</h3>
                <p className="profile-bio">{userInfo.bio}</p>
              </div>

              <div className="profile-info">
                <div className="info-item">
                  <span className="info-icon">📧</span>
                  {userInfo.email}
                </div>
                <div className="info-item">
                  <span className="info-icon">📱</span>
                  {userInfo.phone}
                </div>
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  {userInfo.location}
                </div>
              </div>

              <div className="profile-join-date">
                <span>加入时间：{userInfo.joinDate}</span>
              </div>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="profile-main">
            <div className="content-card">
              <div className="card-header">
                <div className="tabs-container">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="tab-icon">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-body">
                {/* 个人信息标签页 */}
                {activeTab === 'info' && (
                  <div className="tab-content">
                    <div className="tab-header">
                      <h2>个人信息</h2>
                      <button className="edit-btn">✏️ 编辑</button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>姓名</label>
                        <input type="text" defaultValue={userInfo.name} />
                      </div>
                      <div className="form-group">
                        <label>邮箱</label>
                        <input type="email" defaultValue={userInfo.email} />
                      </div>
                      <div className="form-group">
                        <label>手机号</label>
                        <input type="text" defaultValue={userInfo.phone} />
                      </div>
                      <div className="form-group">
                        <label>所在地</label>
                        <input type="text" defaultValue={userInfo.location} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>个人简介</label>
                      <textarea defaultValue={userInfo.bio} rows={3} />
                    </div>
                    <button className="save-btn">保存更改</button>
                  </div>
                )}

                {/* 我的消息标签页 */}
                {activeTab === 'messages' && (
                  <div className="tab-content">
                    <div className="tab-header">
                      <h2>我的消息</h2>
                      <p>查看系统通知和关注事件的更新提醒</p>
                    </div>
                    <div className="messages-list">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`message-item ${!message.read ? 'unread' : ''}`}
                        >
                          <div className="message-content">
                            <div className="message-header">
                              {message.id === 1 || message.id === 3 ? (
                                <Link to={`/newspage/${message.id}`} className="message-title-link">
                                  <h4>{message.title}</h4>
                                </Link>
                              ) : (
                                <h4>{message.title}</h4>
                              )}
                              {!message.read && <span className="unread-badge">新</span>}
                            </div>
                            <p>{message.content}</p>
                            <span className="message-time">{message.time}</span>
                          </div>
                          <button className="mark-read-btn">标记已读</button>
                        </div>
                      ))}
                    </div>
                    <div className="load-more">
                      <button className="load-more-btn">加载更多消息</button>
                    </div>
                  </div>
                )}

                {/* 我的关注标签页 */}
                {activeTab === 'following' && (
                  <div className="tab-content">
                    <div className="tab-header">
                      <h2>我的关注</h2>
                      <p>管理您关注的新闻事件，接收后续发展提醒</p>
                    </div>
                    <div className="following-list">
                      {followedNews.map((news) => (
                        <div key={news.id} className="following-item">
                          <Link to={`/newspage/${news.id}`} className="following-content-link">
                            <div className="following-content">
                              <div className="following-badges">
                                <span className="category-badge">{news.category}</span>
                                <span className={`status-badge ${news.status === '进行中' ? 'active' : 'completed'}`}>
                                  {news.status}
                                </span>
                              </div>
                              <h4>{news.title}</h4>
                              <span className="last-update">最后更新：{news.lastUpdate}</span>
                            </div>
                          </Link>
                          <div className="following-actions">
                            <Link to={`/newspage/${news.id}`}>
                              <button className="view-btn">查看</button>
                            </Link>
                            <button className="bookmark-btn">🔖</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 偏好设置标签页 */}
                {activeTab === 'preferences' && (
                  <div className="tab-content">
                    <div className="tab-header">
                      <h2>偏好设置</h2>
                      <p>自定义您的个性化推荐体验</p>
                    </div>
                    
                    {/* 兴趣偏好 */}
                    <div className="preference-section">
                      <h3>兴趣偏好</h3>
                      <div className="categories-grid">
                        {["科技", "政治", "经济", "环境", "医疗", "教育", "体育", "娱乐", "军事"].map((category) => (
                          <label key={category} className="checkbox-item">
                            <input
                              type="checkbox"
                              defaultChecked={["科技", "经济", "环境"].includes(category)}
                            />
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 推荐设置 */}
                    <div className="preference-section">
                      <h3>推荐设置</h3>
                      <div className="switch-list">
                        <div className="switch-item">
                          <div>
                            <div className="switch-label">启用个性化推荐</div>
                            <div className="switch-desc">基于您的阅读历史和偏好推荐相关内容</div>
                          </div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>
                        <div className="switch-item">
                          <div>
                            <div className="switch-label">热门事件推荐</div>
                            <div className="switch-desc">推荐当前热门和趋势事件</div>
                          </div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button className="save-btn">保存偏好设置</button>
                  </div>
                )}

                {/* 系统设置标签页 */}
                {activeTab === 'settings' && (
                  <div className="tab-content">
                    <div className="tab-header">
                      <h2>通知设置</h2>
                      <p>管理您的通知偏好和隐私设置</p>
                    </div>
                    
                    <div className="settings-section">
                      <h3>通知设置</h3>
                      <div className="switch-list">
                        <div className="switch-item">
                          <div>
                            <div className="switch-label">关注事件更新</div>
                            <div className="switch-desc">当您关注的事件有新进展时接收通知</div>
                          </div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>
                        <div className="switch-item">
                          <div>
                            <div className="switch-label">邮件通知</div>
                            <div className="switch-desc">通过邮件接收重要通知</div>
                          </div>
                          <label className="switch">
                            <input type="checkbox" />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h3>隐私设置</h3>
                      <div className="switch-list">
                        <div className="switch-item">
                          <div>
                            <div className="switch-label">公开个人资料</div>
                            <div className="switch-desc">允许其他用户查看您的基本信息</div>
                          </div>
                          <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button className="save-btn">保存设置</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
