import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/user/Login';
import Register from '../pages/user/Register';
import ProtectedRoute from '../components/ProtectedRoute';

import HomePage from '../pages/HomePage';
import NewsPage from '../pages/newspage';
import StoryPage from '../pages/StoryPage';
import StoryDetailPage from '../pages/StoryDetailPage';
import GlobalPage from '../pages/global';
import RecommendPage from '../pages/RecommendPage';
import ProfilePage from '../pages/user/profile';
import SearchPage from '../pages/search';


const router = createBrowserRouter([
  {
    path: '/',

    element: <Navigate to="/HomePage" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/HomePage',
    element: <HomePage />
  },
  {
    path: '/newspage/:id',
    element: <NewsPage />
  },
  {
    path: '/stories',
    element: <StoryPage />
  },
  {
    path: '/story/:id',
    element: <StoryDetailPage />
  },
   {
    path: '/global',
    element: <GlobalPage />
  },
  {
    path: '/recommend',
    element: <RecommendPage />
  },
  {
    path: '/search',
    element: <SearchPage />
  },
  {
    path: '/profile',
    element:(
      <ProtectedRoute> 
        <ProfilePage /> 
      </ProtectedRoute>
    )
  }
]);

export default router;

