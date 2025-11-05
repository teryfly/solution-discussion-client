import React from 'react';
import { createBrowserRouter, Navigate, redirect } from 'react-router-dom';
import { Login } from '../pages/Login';
import { MainLayout } from '../components/common/MainLayout';
import { ConversationList } from '../pages/ConversationList';
import { ConversationDetail } from '../pages/ConversationDetail';
import { ProjectList } from '../pages/ProjectList';
import { ProjectEdit } from '../pages/ProjectEdit';
import { ExecutionLogPage } from '../pages/ExecutionLog';
import { MarkdownPreview } from '../pages/MarkdownPreview';
import { useGlobalStore } from '../stores/globalStore';

const protectedLoader = () => {
  const { isAuthenticated } = useGlobalStore.getState();
  if (!isAuthenticated()) {
    return redirect('/login');
  }
  return null;
};

const loginLoader = () => {
  const { isAuthenticated } = useGlobalStore.getState();
  if (isAuthenticated()) {
    return redirect('/');
  }
  return null;
};

export const router = createBrowserRouter([
  { path: '/login', element: <Login />, loader: loginLoader },
  {
    path: '/',
    element: <MainLayout />,
    loader: protectedLoader,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat', element: <ConversationList />, loader: protectedLoader },
      { path: 'chat/:id', element: <ConversationDetail />, loader: protectedLoader },
      { path: 'projects', element: <ProjectList />, loader: protectedLoader },
      { path: 'projects/new', element: <ProjectEdit />, loader: protectedLoader },
      { path: 'projects/:id/edit', element: <ProjectEdit />, loader: protectedLoader },
      { path: 'logs', element: <ExecutionLogPage />, loader: protectedLoader },
      { path: 'markdown-preview', element: <MarkdownPreview />, loader: protectedLoader },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);