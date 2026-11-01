import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 开发沙盒：root 用项目根（这样 /src/client/* 能被正确解析），
 * 入口页在 web/index.html，访问 http://localhost:5174/web/。
 * 联调期可打开 proxy 指向宿主 webServer。
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: '/web/',
    // proxy: {
    //   '/dsh-overview': 'http://127.0.0.1:3080',
    // },
  },
})
