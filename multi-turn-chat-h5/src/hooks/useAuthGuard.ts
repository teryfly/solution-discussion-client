import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGlobalStore } from '../stores/globalStore';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useGlobalStore();

  // 立即获取认证状态
  const authenticated = isAuthenticated();

  useEffect(() => {
    // 如果用户信息无效且不在登录页，立即跳转
    if (!authenticated && location.pathname !== '/login') {
      console.warn('⚠️ useAuthGuard: 用户未认证，跳转到登录页');
      console.warn('当前路径:', location.pathname);
      
      // 清除无效的用户信息
      logout();
      
      // 立即跳转到登录页
      navigate('/login', { replace: true });
    }
  }, [authenticated, navigate, location.pathname, logout]);

  return { isAuthenticated: authenticated };
};