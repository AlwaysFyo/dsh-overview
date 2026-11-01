# Agent Note: rename-to-dsh-overview

Status: implemented

## Problem

包名 dsh-workbench 与同生态另一个已发布插件重名：npm 上 dsh-workbench@0.16.1 属于 lee259（右侧文件工作区插件，仓库 lee259/dsh-workbench）。本插件一直 private、未发布，所以暂未真正冲突，但生态里检索、profile 依赖、以及将来发布都会混淆；中文显示名「全景看板」也与包名语义不一致。

## Decision

项目改名为 dsh-overview，中文界面名定为「全景概览」。落地面：package.json name/repository/homepage/bugs 全部指向 dsh-overview；cordis.patch.yml 的 bundle id 与 name 改为 dsh-overview；宿主路由前缀从 /dsh-workbench/* 改为 /dsh-overview/state|events|_debug|session/delete，客户端 api.ts 同步；client slots 的 id 与 key 从 workbench 改为 overview（sidebar.panellist id、main key、conversation.input.dock id overview-resume-draft），侧栏标签「全景概览」。刻意保留的内部名：localStorage 主题键仍为 dshw-theme（改名会重置用户主题）、TypeScript 类型 WorkbenchState / WorkbenchApp 与 lib/client.js 构建入口不变（纯内部符号，无外部契约）。两个远端都改：GitHub AlwaysFyo/dsh-overview（gh repo rename，旧地址 301），CNB one-mugen/dsh-overview（新建空仓库后推送；旧仓库删除以免两个同名仓库并存）。文档原型文件 git mv 为 docs/dsh-overview-prd.html 与 docs/dsh-overview-ui.html，PRD/UI 标题同步为「全景概览」。
## Alternatives considered

保留 dsh-workbench 不改名：最省事，但 npm 名字已被同生态插件占用，将来发布或让别人 dsh plugin add 时必然撞名，检索也会把两个完全不同的插件混在一起。改为 scoped 包名 @alwaysfyo/dsh-workbench：能解决 npm 命名冲突且零源码改动，但生态里仍叫 workbench，用户仍会与 lee259 的包混淆，且私有 scope 对公开仓库没有额外收益。选 dsh-panorama（「全景」直译）：语义贴合，npm 也空闲，但 GitHub 上已有 PANORAMA-360-SE-DSH-PET 这类 DSH 硬件屏插件，检索会轻微串味；dsh-overview 更平实、与「概览」一致。dsh-observatory / dsh-map 同样空闲，但名字偏长或语义过窄（观测台/地图），不如 overview 直白。
## Consequences

代价：这是一次破坏性改名——已安装的 dsh-workbench 0.1.6 必须先卸载再装 dsh-overview 0.1.7，profile 依赖、node_modules 目录、路由前缀全部变化，旧的外部引用（书签、脚本里的 /dsh-workbench/state）会 404；构造上无法兼容旧路由。GitHub 侧旧 URL 由平台 301 兜底，CNB 侧没有重命名 API 的把握，因此新仓库是空历史起点、旧仓库删除后原地址失效。收益：包名、仓库名、侧栏标签、路由前缀第一次统一到 dsh-overview，npm 与 GitHub 主名均无同生态占用，后续发布不再需要二次改名。内部类型名与主题键保持不变，避免了无意义的用户态重置与跨文件改名噪音。

