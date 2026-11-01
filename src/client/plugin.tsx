/**
 * dsh-workbench 渲染端 client half（dsh.client 入口 → lib/client.js）。
 *
 * 宿主加载契约（2026-11-01 从 /plugins/?? 聚合响应逆向确认）：
 * 服务端把本文件包进 __ModuleLoader__.load({id, factory:(require)=>{...}})，
 * 以 CJS 注册表形态加载，**module.exports 就是 cordis 插件**（内置模块一律
 * `exports.apply/inject`，包装器自动 `return module.exports`）。
 * 因此：CJS 产物、require("react") 从注册表取、exports 导出插件；
 * 绝不能用顶层 return（会以裸语句落进聚合脚本 → 整包 SyntaxError）。
 *
 * 界面挂载（dsh-edict 同款模式）：
 *  - sidebar.panellist：左侧栏一枚小图标格子（行高受限，只放图标；点击行为
 *    由宿主统一 selectPanel 处理，id 与 main 的 key 对应）
 *  - main：keyed 整页面板，侧栏点亮后工作台占据主区域
 */
import { createElement, useEffect, useSyncExternalStore } from './react.ts'
import { WorkbenchApp } from './App.tsx'
import { themeCss } from './themeCss.ts'
import {
  consumeResumeDraft,
  getResumeVersion,
  subscribeResumeDraft,
} from './resume.ts'

interface SlotsApi {
  inject(slot: string, register: () => unknown): void
  register(meta: Record<string, unknown>, render: (props?: unknown) => unknown): void
}

interface ClientCtx {
  slots: SlotsApi
  effect(fn: () => () => void, label?: string): void
  get?(name: string): unknown
  [k: string]: unknown
}

type UiWorkspace = {
  openSession?: (target: string) => void
  openWorkspace?: (workspaceId: string, cb: (nextSessionId: string) => void) => unknown
  workspaces?: unknown
} | null

type WorkspacesApi = {
  archiveSession?: (id: string, options?: { stopActivity?: boolean }) => Promise<unknown>
  unarchiveSession?: (id: string) => Promise<unknown>
} | null

export const name = 'dsh-workbench'
// uiWorkspace: 续接跳转/归档/导航总入口；remote: workspaceRegistry（真删除）
export const inject = ['slots', 'uiWorkspace', 'remote']

/** 会话输入框 dock 的宿主注入 props */
interface DockProps {
  sessionId?: string
  inputActions?: { setDraft?: (text: string) => void } | null
}

/**
 * 续接草稿注入器：常驻 conversation.input.dock，目标会话 composer 挂载时
 * 消费队列草稿并 setDraft（可编辑、不自动发送）。Q5 参照 dsh-kanban。
 */
function ResumeDraftInjector(props: DockProps) {
  const version = useSyncExternalStore(subscribeResumeDraft, getResumeVersion)
  useEffect(() => {
    if (!props.sessionId || !props.inputActions?.setDraft) return
    const draft = consumeResumeDraft(props.sessionId)
    if (draft) props.inputActions.setDraft(draft.text)
  }, [version, props.sessionId, props.inputActions])
  return null
}

/** 侧栏格子图标：自绘三列看板（16×16 单色线条，规格对齐官方 PanelRow；备选见 docs/icons-preview.html） */
function SidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2.5" y="2.5" width="3.5" height="7.5" rx="1" stroke="currentColor" />
      <rect x="6.25" y="2.5" width="3.5" height="11" rx="1" stroke="currentColor" />
      <rect x="10" y="2.5" width="3.5" height="6" rx="1" stroke="currentColor" />
    </svg>
  )
}

export function apply(ctx: ClientCtx): void {
  // ⚠ 不要在 apply 里 ctx.get('uiWorkspace')：该调用可能阻塞插件激活 → 整页 boot 永久挂起
  // （2026-11-01 实测：卡死所有页面）。改为「续接」点击时惰性获取（届时服务必然就绪）。
  const getUiWorkspace = (): UiWorkspace => {
    try {
      const direct = (ctx as unknown as Record<string, unknown>)['uiWorkspace'] as UiWorkspace
      if (typeof ctx.get !== 'function') return direct ?? null
      return ((ctx.get('uiWorkspace') as UiWorkspace) ?? direct) ?? null
    } catch {
      return null
    }
  }

  /**
   * 官方 workspaces 服务（真归档/取消归档，archive-manager 同款）。
   * 实测（2026-11-01）：`ctx.workspaces` 属性与 `ctx.get('workspaces')` 都是 undefined，
   * 服务实际挂在 `uiWorkspace.workspaces` 上（原型方法含 archiveSession/unarchiveSession）。
   */
  const getWorkspaces = (): WorkspacesApi | null => {
    try {
      const uiw = getUiWorkspace()
      const viaUi = (uiw as unknown as Record<string, unknown> | null)?.['workspaces']
      if (viaUi && typeof viaUi === 'object' && typeof (viaUi as WorkspacesApi)?.archiveSession === 'function') {
        return viaUi as WorkspacesApi
      }
      const viaProp = (ctx as unknown as Record<string, unknown>)['workspaces']
      if (viaProp && typeof viaProp === 'object') return viaProp as WorkspacesApi
      if (typeof ctx.get !== 'function') return null
      return (ctx.get('workspaces') as WorkspacesApi) ?? null
    } catch {
      return null
    }
  }

  ctx.effect(() => {
    const style = document.createElement('style')
    style.id = 'dsh-workbench-style'
    style.setAttribute('data-plugin', 'dsh-workbench')
    style.textContent = themeCss
    document.head.appendChild(style)
    return () => style.remove()
  }, 'dsh-workbench theme')

  // 左侧栏格子：一枚小图标（对齐官方行高与图标规格）
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      { name: 'sidebar.panellist', id: 'workbench', order: 2, label: '全景看板' },
      () => createElement(SidebarIcon),
    ),
  )

  // 主区域整页面板：key 与侧栏格子的 id 对应，点击格子即点亮
  ctx.slots.inject('main', () =>
    ctx.slots.register({ name: 'main', key: 'workbench' }, () =>
      createElement(
        'div',
        { style: { height: '100%', overflow: 'auto' }, 'data-dsh-workbench': 'page' },
        createElement(WorkbenchApp, { getUiWorkspace, getWorkspaces }),
      ),
    ),
  )

  // 续接草稿注入器：常驻会话输入框 dock（Q5）
  ctx.slots.inject('conversation.input.dock', () =>
    ctx.slots.register(
      { name: 'conversation.input.dock', id: 'workbench-resume-draft', order: 100 },
      (props?: unknown) => createElement(ResumeDraftInjector, (props ?? {}) as DockProps),
    ),
  )
}
