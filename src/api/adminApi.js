const API_BASE_URL = 'http://localhost:8080/api/v1';
const ADMIN_API_BASE_URL = `${API_BASE_URL}/admin`;

// get JWT token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('admin_token');
};

// set common headers for API requests
const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
    try {
        const url = `${ADMIN_API_BASE_URL}${endpoint}`;
        const config = {
            headers: getAuthHeaders(),
            ...options
        };

        const Response = await fetch(url, config);
        const response = await Response.json();

        if (!Response.ok) {
            throw new Error(response.error || response.message || `HTTP error! status: ${Response.status}`);
        }

        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// admin login
export const adminLogin = async (credentials) => {
    try {
        const Response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const response = await Response.json();

        if (response.code != 200) {
            throw new Error(response.error || response.message || 'Login failed');
        }

        // save token and user info to localStorage
        if (response.data && response.data.token) {
            localStorage.setItem('admin_token', response.data.token);
            localStorage.setItem('user_info', JSON.stringify(response.data.user));
        }

        return response;
    } catch (error) {
        console.error('Admin login failed:', error);
        throw error;
    }
};

// admin logout 
export const adminLogout = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin-logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            console.warn('Logout failed with status:', response.status);
        }
    } catch (error) {
        console.warn('Logout failed:', error);
    } finally {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_info');
    }
};

export const checkAdminAuth = () => {
    const token = getAuthToken();
    const user = localStorage.getItem('user_info');

    if (!token || !user) {
        return { isAuthenticated: false, user: null };
    }

    try {
        const userData = JSON.parse(user);
        const isAdmin = userData.role === 'admin';

        return {
            isAuthenticated: isAdmin,
            user: isAdmin ? userData : null
        };
    } catch (error) {
        console.error('Error parsing user data:', error);
        return { isAuthenticated: false, user: null };
    }
};

export const getCurrentAdminUser = () => {
    try {
        const user = localStorage.getItem('user_info');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting current admin user:', error);
        return null;
    }
};


export const getSystemStats = async () => {
    return await apiRequest('/stats');
};


// user management

// 分页方式展示用户列表
// 用户列表显示 用户id 头像 用户名 邮箱 角色 状态 创建时间 操作(编辑 删除)
// 可以按照一定方式排序 筛选
// 用户搜索 by username or email
// 管理员创建用户

// todo
export const getUsers = async (params = {}) => {
    const queryParams = new URLSearchParams();

    // 后端使用的参数名称：page, size, role, status, search
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
            // 将前端的 pageSize 映射为后端的 size
            const backendKey = key === 'pageSize' ? 'size' : key;
            queryParams.append(backendKey, params[key]);
        }
    });

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    return await apiRequest(endpoint);
};

export const getUserById = async (id) => {
    return await apiRequest(`/users/${id}`);
};

export const updateUser = async (id, userData) => {
    return await apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
};

export const deleteUser = async (id) => {
    return await apiRequest(`/users/${id}`, {
        method: 'DELETE'
    });
};

// ==================== 事件管理 ====================
export const getAllEvents = async (params = {}) => {
    const queryParams = new URLSearchParams();

    // 后端支持的过滤参数：page, limit, status, category, created_by, search, sort_by
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
            // 将前端的 pageSize 映射为后端的 limit
            const backendKey = key === 'pageSize' ? 'limit' : key;
            queryParams.append(backendKey, params[key]);
        }
    });

    const queryString = queryParams.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;

    return await apiRequest(endpoint);
};

export const getEvents = async (params = {}) => {
    return await getAllEvents(params);
};

export const createEvent = async (eventData) => {
    return await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
    });
};

export const updateEvent = async (id, eventData) => {
    return await apiRequest(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData)
    });
};

export const deleteEvent = async (id) => {
    return await apiRequest(`/events/${id}`, {
        method: 'DELETE'
    });
};

// 清空所有事件
export const clearAllEvents = async () => {
    return await apiRequest('/events', {
        method: 'DELETE'
    });
};

// ==================== 新闻管理 ====================
export const getAllNews = async (params = {}) => {
    const queryParams = new URLSearchParams();

    // 后端支持的过滤参数：page, size, status, category, source_type, search
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
            // 将前端的 pageSize 映射为后端的 size
            const backendKey = key === 'pageSize' ? 'size' : key;
            queryParams.append(backendKey, params[key]);
        }
    });

    const queryString = queryParams.toString();
    const endpoint = `/news${queryString ? `?${queryString}` : ''}`;

    return await apiRequest(endpoint);
};

export const getNews = async (params = {}) => {
    return await getAllNews(params);
};

export const createNews = async (newsData) => {
    return await apiRequest('/news', {
        method: 'POST',
        body: JSON.stringify(newsData)
    });
};

export const updateNews = async (id, newsData) => {
    return await apiRequest(`/news/${id}`, {
        method: 'PUT',
        body: JSON.stringify(newsData)
    });
};

export const deleteNews = async (id) => {
    return await apiRequest(`/news/${id}`, {
        method: 'DELETE'
    });
};

// RSS Management
export const getRssSources = async (params = {}) => {
    const queryParams = new URLSearchParams();

    // 后端支持的参数：page, limit
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
            // 将前端的 pageSize 映射为后端的 limit
            const backendKey = key === 'pageSize' ? 'limit' : key;
            queryParams.append(backendKey, params[key]);
        }
    });

    const queryString = queryParams.toString();
    const endpoint = `/rss${queryString ? `?${queryString}` : ''}`;

    return await apiRequest(endpoint);
};

export const createRssSource = async (sourceData) => {
    // 将前端字段映射为后端字段
    const backendData = {
        ...sourceData,
        update_freq: sourceData.fetch_interval || 60
    };
    delete backendData.fetch_interval;

    return await apiRequest('/rss', {
        method: 'POST',
        body: JSON.stringify(backendData)
    });
};

export const updateRssSource = async (id, sourceData) => {
    // 将前端字段映射为后端字段
    const backendData = {
        ...sourceData,
        update_freq: sourceData.fetch_interval
    };
    delete backendData.fetch_interval;

    return await apiRequest(`/rss/${id}`, {
        method: 'PUT',
        body: JSON.stringify(backendData)
    });
};

export const deleteRssSource = async (id) => {
    return await apiRequest(`/rss/${id}`, {
        method: 'DELETE'
    });
};

export const fetchRssSource = async (id) => {
    return await apiRequest(`/rss/${id}/fetch`, {
        method: 'POST'
    });
};

export const fetchAllRssSources = async () => {
    return await apiRequest('/rss/fetch-all', {
        method: 'POST'
    });
};

export const getRssCategories = async () => {
    return await apiRequest('/rss/categories');
};

export const getRssStats = async () => {
    return await apiRequest('/rss/stats');
};


// ==================== 错误处理 ====================
export const handleApiError = (error) => {
    console.error('API Error:', error);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
        return 'Authentication failed. Please login again.';
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return 'You do not have permission to perform this action.';
    }

    if (error.message.includes('404') || error.message.includes('Not Found')) {
        return 'The requested resource was not found.';
    }

    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        return 'Server error. Please try again later.';
    }

    return error.message || 'An unexpected error occurred.';
};

export default {
    // 系统统计
    getSystemStats,

    // 用户管理
    getUsers,
    getUserById,
    // createUser, // 后端未提供此接口
    updateUser,
    deleteUser,

    // RSS源管理
    getRssSources,
    createRssSource,
    updateRssSource,
    deleteRssSource,
    fetchRssSource,
    fetchAllRssSources,
    getRssCategories,
    getRssStats,

    // 事件管理
    getAllEvents,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    clearAllEvents,

    // 新闻管理
    getAllNews,
    getNews,
    createNews,
    updateNews,
    deleteNews,

    // 认证相关
    adminLogin,
    adminLogout,
    checkAdminAuth,
    getCurrentAdminUser,

    // 错误处理
    handleApiError
};