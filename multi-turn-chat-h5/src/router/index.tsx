import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { MainLayout } from '../components/common/MainLayout';
import { ConversationList } from '../pages/ConversationList';
import { ConversationDetail } from '../pages/ConversationDetail';
import { ProjectList } from '../pages/ProjectList';
import { ProjectEdit } from '../pages/ProjectEdit';
import { ExecutionLogPage } from '../pages/ExecutionLog';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />,
      },
      {
        path: 'chat',
        element: <ConversationList />,
      },
      {
        path: 'chat/:id',
        element: <ConversationDetail />,
      },
      {
        path: 'projects',
        element: <ProjectList />,
      },
      {
        path: 'projects/:id/edit',
        element: <ProjectEdit />,
      },
      {
        path: 'logs',
        element: <ExecutionLogPage />,
      },
    ],
  },
]);