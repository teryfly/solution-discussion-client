import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
function getSessionIdFromQuery(search: string) {
  const params = new URLSearchParams(search);
  return params.get('session') || '';
}
export function useUrlSync(conversationId: string, conversationList: any[], setConversationId: (id: string) => void) {
  const location = useLocation();
  const navigate = useNavigate();
  // 会话切换时更新URL
  useEffect(() => {
    if (conversationId) {
      const url = new URL(window.location.href);
      url.searchParams.set('session', conversationId);
      if (getSessionIdFromQuery(location.search) !== conversationId) {
        navigate(`${url.pathname}?session=${conversationId}`, { replace: true });
      }
    }
    // eslint-disable-next-line
  }, [conversationId]);
  // 页面初始载入时，根据URL参数切换会话
  useEffect(() => {
    const sessionId = getSessionIdFromQuery(location.search);
    if (sessionId && sessionId !== conversationId) {
      if (conversationList.find(c => c.id === sessionId)) {
        setConversationId(sessionId);
      }
    }
    // eslint-disable-next-line
  }, [location.search, conversationList]);
}