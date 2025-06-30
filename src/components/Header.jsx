import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './Header.css';

const Header = () => {
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loginStatus === 'true');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.location.href = '/HomePage';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <header className={`header ${theme}`}>
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-icon">📰</span>
            <span className="logo-text">EasyPeek</span>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/" className="nav-link">首页</Link>
          <Link to="/stories" className="nav-link">热点故事</Link>
          <Link to="/global" className="nav-link">全球新闻</Link>
          <Link to="/tech" className="nav-link">推荐</Link>
        </nav>

        <div className="header-right">
          {isLoggedIn ? (
            <>
              <Link to="/profile">
                <button className="profile-btn">个人中心</button>
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                退出登录
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="logout-btn">
              登录
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;