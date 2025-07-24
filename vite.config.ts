import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ❗️ 关键：告诉 Vite 所有资源都要以 /shellwalker/ 开头去请求
  base: '/shellwalker/',

  plugins: [
    react(),
  ],

  // 你自己的其他配置…
})
