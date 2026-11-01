import type { ProjectState, SessionMeta, WorkbenchState } from '../model/types.ts'

/**
 * 开发期 mock 数据：与 WorkbenchState 严格同构（真实形态参考 scripts/probe 实测输出）。
 * 覆盖 PRD 关键状态：运行中项目、空闲项目、路径失效（AC-2）、项目归档（R2）、孤儿桶、空待办。
 */

const NOW = Date.now()
const H = 3600_000
const D = 24 * H

function session(partial: Partial<SessionMeta> & { id: string }): SessionMeta {
  return {
    title: null,
    cwd: null,
    createdAt: NOW - 3 * D,
    lastPromptAt: null,
    lastActivityAt: NOW - 2 * H,
    turns: 1,
    tokenTotals: null,
    todos: [],
    archived: false,
    source: 'live',
    dirName: null,
    ...partial,
  }
}

function project(partial: Partial<ProjectState> & { id: string; path: string; title: string }): ProjectState {
  return {
    workspaceId: null,
    existsOnDisk: true,
    sessions: [],
    lastActivityAt: null,
    ...partial,
  }
}

export function mockState(): WorkbenchState {
  const osuply = project({
    id: 'ws-osuply',
    path: 'D:\\Projects\\osuply',
    title: 'osuply',
    workspaceId: 'ws-osuply',
    sessions: [
      session({ id: 's-1', title: '重构 osuply 部署脚本', cwd: 'D:\\Projects\\osuply', lastActivityAt: NOW - 30 * 60_000, turns: 14, tokenTotals: { uncachedInputTokens: 486_000, outputTokens: 61_000, cacheReadTokens: 0, cacheWriteTokens: 0 }, todos: [
        { content: '拆分 deploy 与 rollback 两个子命令', status: 'in_progress' },
        { content: '补 README 部署章节的失败回滚说明', status: 'pending' },
        { content: '确认 Node 24 下 pnpm 版本锁定', status: 'completed' },
      ] }),
      session({ id: 's-2', title: '排查 pnpm 解析报错', cwd: 'D:\\Projects\\osuply', lastActivityAt: NOW - 26 * H, turns: 3, todos: [{ content: '复现 hoisted 模式下的 peer 冲突', status: 'pending' }] }),
      session({ id: 's-3', title: '迁移 CI 缓存到本地', cwd: 'D:\\Projects\\osuply', lastActivityAt: NOW - 3 * D, turns: 9 }),
      session({ id: 's-4', title: '整理 README 部署章节', cwd: 'D:\\Projects\\osuply', lastActivityAt: NOW - 5 * D, turns: 5 }),
    ],
  })
  osuply.lastActivityAt = NOW - 30 * 60_000

  const onenote = project({
    id: 'ws-onenote',
    path: 'D:\\Blogs\\OneNote',
    title: 'OneNote',
    workspaceId: 'ws-onenote',
    sessions: [
      session({ id: 's-5', title: '对比 Web Fetch 与 Markdown 转换技能', cwd: 'D:\\Blogs\\OneNote', lastActivityAt: NOW - 20 * H, turns: 12, tokenTotals: { uncachedInputTokens: 1_160_000, outputTokens: 213_000, cacheReadTokens: 0, cacheWriteTokens: 0 } }),
      session({ id: 's-6', title: 'Image 重命名', cwd: 'D:\\Blogs\\OneNote', lastActivityAt: NOW - 6 * D, turns: 53 }),
    ],
  })
  onenote.lastActivityAt = NOW - 20 * H

  const dshFairy = project({
    id: 'ws-fairy',
    path: 'D:\\Projects\\dsh-fairy',
    title: 'dsh-fairy',
    workspaceId: 'ws-fairy',
    sessions: [
      session({ id: 's-7', title: '绝区零 Fairy 插件复刻与样式调优', cwd: 'D:\\Projects\\dsh-fairy', lastActivityAt: NOW - 6 * D, turns: 62, tokenTotals: { uncachedInputTokens: 6_859_000, outputTokens: 1_628_000, cacheReadTokens: 0, cacheWriteTokens: 0 } }),
    ],
  })
  dshFairy.lastActivityAt = NOW - 6 * D

  const deadPath = project({
    id: 'ws-dead',
    path: 'D:\\Projects\\moved-away',
    title: 'moved-away',
    workspaceId: 'ws-dead',
    existsOnDisk: false,
    sessions: [session({ id: 's-8', title: '被移动前的最后会话', cwd: 'D:\\Projects\\moved-away', lastActivityAt: NOW - 12 * D, turns: 4 })],
  })
  deadPath.lastActivityAt = NOW - 12 * D

  const archived = project({
    id: 'ws-imageDedup',
    path: 'D:\\Projects\\ToolCube\\imageDedup',
    title: 'imageDedup',
    workspaceId: 'ws-imageDedup',
    archived: true,
    archivedAt: NOW - 9 * D,
    sessions: [
      session({ id: 's-9', title: '系统性的分析一下当前项目', cwd: 'D:\\Projects\\ToolCube\\imageDedup', lastActivityAt: NOW - 20 * D, turns: 115, archived: true, source: 'archive' }),
      session({ id: 's-10', title: '去重算法 spike', cwd: 'D:\\Projects\\ToolCube\\imageDedup', lastActivityAt: NOW - 21 * D, turns: 8, archived: true, source: 'archive' }),
    ],
  })
  archived.lastActivityAt = NOW - 20 * D

  const orphan = project({
    id: 'orphan:c:\\users\\yolo\\.dsh',
    path: 'C:\\Users\\yolo\\.dsh',
    title: '.dsh',
    sessions: [session({ id: 's-11', title: '户部尚书承办数据统计旨意', cwd: 'C:\\Users\\yolo\\.dsh', lastActivityAt: NOW - 30 * H, turns: 1 })],
  })
  orphan.lastActivityAt = NOW - 30 * H

  return {
    generatedAt: NOW,
    projects: [osuply, onenote, dshFairy, deadPath, archived, orphan],
    warnings: [],
  }
}
