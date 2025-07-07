const API_BASE_URL = 'http://localhost:8080/api/v1';

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 新闻API
export const newsApi = {
  // 获取所有新闻
  getAllNews: async (page = 1, size = 10) => {
    const response = await fetch(`${API_BASE_URL}/news?page=${page}&size=${size}`);
    if (!response.ok) {
      throw new Error('获取新闻列表失败');
    }
    return response.json();
  },

  // 获取单个新闻详情
  getNewsById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/news/${id}`);
    if (!response.ok) {
      throw new Error('获取新闻详情失败');
    }
    return response.json();
  },

  // 获取热门新闻
  getHotNews: async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/news/hot?limit=${limit}`);
    if (!response.ok) {
      throw new Error('获取热门新闻失败');
    }
    return response.json();
  },

  // 获取最新新闻
  getLatestNews: async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/news/latest?limit=${limit}`);
    if (!response.ok) {
      throw new Error('获取最新新闻失败');
    }
    return response.json();
  },

  // 按分类获取新闻
  getNewsByCategory: async (category, limit = 10, sort = 'latest') => {
    const response = await fetch(`${API_BASE_URL}/news/category/${category}?limit=${limit}&sort=${sort}`);
    if (!response.ok) {
      throw new Error('获取分类新闻失败');
    }
    return response.json();
  },

  // 搜索新闻
  searchNews: async (query, page = 1, size = 10, mode = 'normal') => {
    const params = new URLSearchParams({
      query: query,
      page: page.toString(),
      size: size.toString(),
      mode: mode
    });
    
    const response = await fetch(`${API_BASE_URL}/news/search?${params}`);
    if (!response.ok) {
      throw new Error('搜索新闻失败');
    }
    return response.json();
  },

  // 增加浏览量
  incrementView: async (newsId) => {
    const response = await fetch(`${API_BASE_URL}/news/${newsId}/view`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('更新浏览量失败');
    }
    return response.json();
  },

  // 点赞/取消点赞新闻
  likeNews: async (newsId) => {
    const response = await fetch(`${API_BASE_URL}/news/${newsId}/like`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('点赞操作失败');
    }
    const result = await response.json();
    return {
      success: result.code === 200,
      data: result.data,
      message: result.message
    };
  },

  // 获取点赞状态
  getLikeStatus: async (newsId) => {
    const response = await fetch(`${API_BASE_URL}/news/${newsId}/like`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('获取点赞状态失败');
    }
    const result = await response.json();
    return {
      success: result.code === 200,
      data: result.data,
      message: result.message
    };
  }
}; 