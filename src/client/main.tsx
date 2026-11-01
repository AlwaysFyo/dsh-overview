import { createRoot } from 'react-dom/client'
import { WorkbenchApp } from './App.tsx'
import { themeCss } from './themeCss.ts'

// dev 沙盒（vite）注入样式；插件形态由 client half 自行注入同一份 themeCss
const style = document.createElement('style')
style.textContent = themeCss
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(<WorkbenchApp />)
