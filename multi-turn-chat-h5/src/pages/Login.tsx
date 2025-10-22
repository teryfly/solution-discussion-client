import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../stores/globalStore';
import { setAuthToken } from '../api/config';
import { useToast } from '../hooks/useToast';
import '../styles/Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useGlobalStore();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      showToast({ message: '用户名格式不正确', type: 'error' });
      return;
    }

    if (!password || password.length < 6) {
      showToast({ message: '密码长度至少6位', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Mock login - in real app, call API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // 生成符合后端要求的 token (必须以 sk-test 或 poe-sk 开头)
      const mockToken = `sk-test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // 重要：先设置 token，再设置 user
      setAuthToken(mockToken);
      
      const mockUser = {
        id: '1',
        username,
        token: mockToken,
      };

      setUser(mockUser);
      
      console.log('✅ 登录成功，Token:', mockToken);
      showToast({ message: '登录成功', type: 'success' });
      navigate('/');
    } catch (error: any) {
      showToast({ message: error.message || '登录失败', type: 'error' });
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
              💡 提示：首次使用请直接输入任意用户名和密码登录
            </small>
          </div>
        </form>
      </div>
    </div>
  );
};