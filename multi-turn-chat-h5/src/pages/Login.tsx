import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../stores/globalStore';
import { authApi } from '../api/auth';
import { useToast } from '../hooks/useToast';
import '../styles/Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, user } = useGlobalStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      showToast({ message: '请输入用户名', type: 'error' });
      return;
    }
    if (!password) {
      showToast({ message: '请输入密码', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ userName: username.trim(), password });
      if (!res || !res.name || !res.user) {
        throw new Error('登录响应数据不完整');
      }
      if (res.user !== username.trim()) {
        throw new Error('登录响应用户名不匹配');
      }

      setUser({
        id: res.user,
        username: res.user,
        name: res.name,
        token: '',
      });

      showToast({ message: `欢迎，${res.name}`, type: 'success' });
      navigate('/', { replace: true });
    } catch (err: any) {
      setUser(null);
      showToast({ message: err?.message || '登录失败，请检查用户名和密码', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">🤖</div>
        <h1 className="login-title">AI辅助研发平台</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>记住登录状态</span>
            </label>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="login-hint">
            <small style={{ color: '#5f6368', marginTop: '12px', display: 'block', textAlign: 'center' }}>
              💡 提示：请使用您的账号密码登录系统
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};