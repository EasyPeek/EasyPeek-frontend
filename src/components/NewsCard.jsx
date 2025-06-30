import React from 'react';
import './NewsCard.css';

const NewsCard = ({ news, eventConfig, onNewsClick }) => {
  return (
    <div className="news-item" onClick={() => onNewsClick(news.id)}>
      <div className="news-header">
        {/* 新闻分类标签 - 左上角 */}
        <div className="news-category-badge">
          {news.category}
        </div>
        {/* 所属事件标签 - 右上角 */}
        <div 
          className="news-event-badge"
          style={{
            backgroundColor: eventConfig[news.belonged_event]?.bgColor
          }}
        >
          {eventConfig[news.belonged_event]?.label}
        </div>
      </div>
      <h3 className="news-title">{news.title}</h3>
      <p className="news-summary">{news.summary}</p>
      <div className="news-meta">
        <span className="news-time">{news.published_at}</span>
        <span className="news-source">{news.source}</span>
      </div>
    </div>
  );
};

export default NewsCard;