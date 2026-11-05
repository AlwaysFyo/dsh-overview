import { createRoot } from 'react-dom/client'
import { WorkbenchApp } from './App.tsx'
import { themeCss } from './themeCss.ts'

// dev 沙盒（vite）注入样式；插件形态由 client half 自行注入同一份 themeCss
const style = document.createElement('style')
style.textContent = themeCss
document.head.appendChild(style)

// 沙盒便利：?theme=dark|light 预设主题（写 localStorage，与顶栏切换同一存储）
try {
  const t = new URLSearchParams(location.search).get('theme')
  if (t === 'dark' || t === 'light') localStorage.setItem('dshw-theme', t)
} catch {}

createRoot(document.getElementById('root')!).render(<WorkbenchApp />)
