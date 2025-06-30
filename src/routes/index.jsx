
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../user/Login';
import Register from '../user/Register';
import ProtectedRoute from '../components/ProtectedRoute';

import HomePage from '../pages/HomePage';
import NewsPage from '../pages/newspage';
import StoryPage from '../pages/StoryPage';
import StoryDetailPage from '../pages/StoryDetailPage';
import ProfilePage from '../user/profile';


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
    path: '/profile',
    element:(
      <ProtectedRoute> 
        <ProfilePage /> 
      </ProtectedRoute>
    )
  }
]);

export default router;

