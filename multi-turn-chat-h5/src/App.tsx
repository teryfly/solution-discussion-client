import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useGlobalStore } from './stores/globalStore';
import './App.css';

function App() {
  const { theme, fontSize, isAuthenticated } = useGlobalStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [theme, fontSize]);

  // 在应用启动时验证用户信息
  useEffect(() => {
    const authenticated = isAuthenticated();
    const currentPath = window.location.pathname;
    
    console.log('🔍 App 启动检查:');
    console.log('  - 当前路径:', currentPath);
    console.log('  - 认证状态:', authenticated);
    
    // 如果未认证且不在登录页，重定向到登录页
    if (!authenticated && currentPath !== '/login') {
      console.warn('⚠️ App: 未认证用户访问受保护路由，重定向到登录页');
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  return <RouterProvider router={router} />;
}

export default App;