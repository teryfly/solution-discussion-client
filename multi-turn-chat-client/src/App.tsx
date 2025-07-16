import { Routes, Route } from 'react-router-dom';
import ConversationLayout from './ConversationLayout';
import NewConversationPage from './NewConversationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ConversationLayout />} />
      <Route path="/chat/:conversationId" element={<ConversationLayout />} />
      <Route path="/new" element={<NewConversationPage />} />
      {/* 其它路由 */}
    </Routes>
  );
}