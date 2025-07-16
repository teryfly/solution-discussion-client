import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import NewConversationPage from './NewConversationPage';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/*" element={<App />} />
      <Route path="/new" element={<NewConversationPage />} />
    </Routes>
  </BrowserRouter>
);