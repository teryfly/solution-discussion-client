import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1573,
    hmr: false, // 禁用热更新（HMR）
  },
})
