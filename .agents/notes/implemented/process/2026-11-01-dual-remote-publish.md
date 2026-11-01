# Agent Note: dual-remote-publish

Status: implemented

## Problem

项目此前没有版本控制，也没有任何远端仓库；用户要求把 dsh-workbench 公开到 CNB 并同步到 GitHub。需要一个在"作者本机推送"这一真实工作流下不漂移、且不把 GitHub 写凭据托管给 CNB 的同步方案。

## Decision

项目发布为两个公开仓库：CNB `one-mugen/dsh-workbench`（origin，fetch 源）与 GitHub `AlwaysFyo/dsh-workbench`（只读远端 `github`）。同步机制是 git 原生的多 pushURL，而不是平台级镜像：`git remote set-url --add --push origin https://cnb.cool/one-mugen/dsh-workbench.git` 与 `... --add --push origin https://github.com/AlwaysFyo/dsh-workbench.git` 并存，因此一次 `git push` 顺序写入两端；`origin` 仍从 CNB fetch，`github` 仅用于 fetch/显式 push。

仓库创建路径固定下来：CNB 侧用 OpenAPI `POST https://api.cnb.cool/{group}/-/repos`（Bearer 访问令牌，body { name, visibility: public, description }，201 即成功），令牌取自本机 git 凭据管理器（host=cnb.cool），不写入任何文件；GitHub 侧用 `gh repo create <owner>/<repo> --public --description ...`，gh 已登录 AlwaysFyo。首次推送为基线提交 `681a927`（59 个文件）；`.gitignore` 排除 `node_modules/`、`lib/`、`*.tgz`、`*.log`、`.refs/`，因此构建产物与参考仓库克隆不进仓库。

发布纪律：源码、docs、tests、scripts、KANBAN.json、.agents/notes 均入库；版本号以 package.json 为准，打 tarball 安装到 profile 后必须核对 `lib/` 哈希；公开仓库不含任何令牌、个人绝对路径或本机存储快照（发布前对 src/docs/tests/scripts/web 做过 gho_/Bearer/1910 前缀与 C:\\Users\\yolo 扫描，仅 mock 数据含 D:\\Projects 示例路径，属演示数据）。

许可与 CI 固定为：MIT（LICENSE，Copyright (c) 2026 AlwaysFyo），package.json 补 `license`/`author`/`repository`（git+https://github.com/AlwaysFyo/dsh-workbench.git）/`homepage`（CNB）/`bugs`。CI 跑在 GitHub Actions（.github/workflows/ci.yml：Node 24 + `npm ci` + `npm run check` + `npm test`，push main / PR / 手动触发），因为 CNB 侧没有现成流水线，而 GitHub 的 badge 端点可直接匿名取用；CNB 在 README 里只作为镜像入口。README 顶部三枚徽章：CI 状态、MIT、CNB 镜像。CI 不覆盖构建产物（lib/ 入库被忽略），因此它只证明源码能通过类型检查与单测，不证明 tarball 可安装。负向保证：不添加 CNB 流水线、不把 GitHub PAT 交给 CNB、不发布 npm 包（保持 `private: true`）。
## Alternatives considered

**CNB Git Sync 插件（tencentcom/git-sync）**：平台级自动双向同步，听起来最省心。放弃的原因是它要求在 CNB 仓库侧保存一个可写 GitHub PAT 并维护仓库映射，等于把第三方写权限托管到平台配置里；对本项目"作者单向发布"的诉求，双 pushURL 已足够，且凭据仍留在本机凭据管理器。

**只推 CNB，偶尔手动镜像 GitHub**：零配置，但一旦忘记 mirror，两端会静默漂移；实测过一次 README 更新就差点只在 CNB 生效。双 pushURL 把"同步"变成默认动作，成本只有一行 remote 配置。

**GitHub 为主、CNB 为镜像**：与用户既有习惯相反——本机其他项目（dsh-fairy 等）的 origin 都是 cnb.cool，GitHub 作为第二远端。
## Consequences

代价：push 的失败面扩大——任一远端拒绝（令牌过期、默认分支保护）都会让整次 push 报错，需要分别 `git push origin/main` 与 `git push github main` 排查；origin 的 fetch 只走 CNB，GitHub 侧改动不会自动回流，需要手动 fetch 合并。收益：一次 push 两端同哈希，公开仓库无需任何平台侧凭据配置即可维持同步；匿名 clone 可验证公开性（关闭 credential.helper 后仍能 clone）。注意 KANBAN.json 与 .agents/notes 也在版本控制内，每次看板/笔记更新会产生提交，需要一并推送以免两端分叉。

