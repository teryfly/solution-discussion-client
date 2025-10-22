import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../stores/globalStore';

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { user } = useGlobalStore();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  return { isAuthenticated: !!user };
};