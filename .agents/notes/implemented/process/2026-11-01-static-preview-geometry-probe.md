# Agent Note: static-preview-geometry-probe

Status: implemented

## Problem

客户端版式改动（详情页重排这类）在本仓库没有可用的视觉验证回路：`npm run dev`（vite）在受限沙箱里起不来，原因是 vite 配置加载会对自身路径做 execFile 真实路径解析，被拒绝后抛 `spawn EPERM`；本机也没有 playwright/puppeteer。于是每次改 CSS 只能靠读代码猜效果，用户看到的「布局不太对」往往要来回好几轮才对上。

## Decision

仓库里保留一个 gitignored 的 `.preview/` 静态预览回路，用 esbuild + headless Edge 把详情页渲染出来并**量出几何**，替代截图肉眼核对。构成：`.preview/entry.tsx` 直接用 `mockState()` 的一个项目渲染 `Detail`，并把 `themeCss` 注入 `<style>`，外层给 `<div class="wb-root">`（`.wb-root` 自带页面内边距，不要再套容器）；`.preview/shim.js` 通过 esbuild 的 `inject` 顶掉 `require` 标识符，把 `react` / `react/jsx-runtime` 解析到打包进来的真实 React（客户端一半的 `src/client/react.ts` 用 `require("react")` 取运行时，宿主侧由 `__ModuleLoader__` 工厂注入）；`.preview/build.mjs` 以 `format: 'iife'` 打包，因为 `file://` 下 ES module 会被 CORS 拦掉，而 iife 可以直接双击打开；`.preview/probe.html` 在 `load` 后延时测量 `getBoundingClientRect`，把结果写进 `document.body.dataset.probe*`，再用 `msedge --headless=new --dump-dom --virtual-time-budget=4000` 抓 HTML 取出 JSON。

判定口径是「结构断言」而不是像素相似：头部四件是否同一行且主按钮贴右、KPI 四格宽度是否相等、标签区与数值区是否上下分离（`v.y > k.y`）、tab 与「筛选/排序」是否共用一条底线（`listbarRightGap`）、会话行是否两行且各行等高、右栏卡片数是否等于 2、`documentElement.scrollWidth === clientWidth` 有无横向溢出、以及浮层打开后是否仍在视口内并盖在列表上。这些断言在无视觉模型时也能给出可判定的结论。

边界：`.preview/` 只用于版式与几何，不验证真实宿主的数据链路（mock 态、无 SSE、无宿主服务），也不进入 `tsconfig` 的 include 与打包入口；产物 `bundle.js` 780KB 属一次性中间物，随时可重建。
## Alternatives considered

**继续用 vite dev 当预览回路**：沙箱里 `spawn EPERM` 是硬阻塞，且它只解决「看得到」，仍要人眼判断，不能给出可断言的结论。**装 playwright 做端到端截图**：本机没有该依赖、也不该为一个版式改动引入重型依赖，且截图仍需视觉模型才能读。**改用 jsdom 单测渲染断言**：jsdom 没有布局引擎，`getBoundingClientRect` 恒为 0，量不出任何版式问题。**切换客户端打包器（esbuild → rolldown）以绕开 spawn**：能解决构建期的 spawn，但改的是发布链路而不是验证链路，风险面更大，留作单独议题。
## Consequences

代价：多维护三个一次性脚本，且它们必须跟着 `Detail` 的 props 与 `.wb-root` 结构走；`entry.tsx` 里挑项目的逻辑（选会话 ≥4 个的项目）是硬编码，换 mock 数据可能挑到空项目。收益：CSS 改动可以在提交前量出「行高不齐 / 右栏还是 4 张卡 / 有横向溢出」这类错误——本轮就是靠探针发现 `.wb-srow` 的 `min-height: 54px` 在 content-box 下把行撑到 73px（描边与 padding 不计入），改成 `min-height: 40px` 后三行统一 59px；这类问题靠读 CSS 是看不出来的。另附一条环境事实：`npm test` 的 `node --test` 会为每个文件 spawn 子进程，受限沙箱下同样 `spawn EPERM`，可改用 `node --experimental-strip-types <file>.ts` 逐文件在进程内跑（`tests/host-routes.test.ts` 会留 handle 不退出，需配合 force-exit）。

