import { Routes, Route } from 'react-router-dom';
import ConversationLayout from './ConversationLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ConversationLayout />} />
      <Route path="/chat/:conversationId" element={<ConversationLayout />} />
      {/* 其它路由 */}
    </Routes>
  );
}