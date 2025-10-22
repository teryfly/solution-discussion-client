import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useGlobalStore } from './stores/globalStore';
import './App.css';

function App() {
  const { theme, fontSize } = useGlobalStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [theme, fontSize]);

  return <RouterProvider router={router} />;
}

export default App;