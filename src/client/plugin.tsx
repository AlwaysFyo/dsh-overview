/**
 * dsh-overview 渲染端 client half（dsh.client 入口 → lib/client.js）。
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
import { createElement, useEffect, useState, useSyncExternalStore } from './react.ts'
import { WorkbenchApp } from './App.tsx'
import { bindSessionLiveness, type SessionListSource } from './liveness.ts'
import { readPref, writePref } from './settings.ts'
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

export const name = 'dsh-overview'
// uiWorkspace: 续接跳转/归档/导航总入口；remote: workspaceRegistry（真删除）；
// sessions: 官方客户端会话列表（「运行中」真源，见 liveness.ts）
export const inject = ['slots', 'uiWorkspace', 'remote', 'sessions']

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

/** 插件详情卡（设置 → 插件 → 全景概览）里的两个开关 */
interface ConfigProps {
  view?: string
}

function PrefRow(props: {
  label: string
  desc: string
  on: boolean
  onChange: (next: boolean) => void
}) {
  return createElement(
    'div',
    { className: 'dsho-cfg-row' },
    createElement(
      'div',
      { className: 'dsho-cfg-txt' },
      createElement('div', { className: 'dsho-cfg-label' }, props.label),
      createElement('div', { className: 'dsho-cfg-desc' }, props.desc),
    ),
    createElement(
      'button',
      {
        type: 'button',
        role: 'switch',
        'aria-checked': props.on,
        'aria-label': props.label,
        className: props.on ? 'dsho-switch is-on' : 'dsho-switch',
        onClick: () => props.onChange(!props.on),
      },
      createElement('span', { className: 'dsho-knob' }),
    ),
  )
}

function BundleConfigCard(props?: unknown) {
  const p = (props ?? {}) as ConfigProps
  const [sidebar, setSidebar] = useState(() => readPref('sidebarEntry'))
  const [search, setSearch] = useState(() => readPref('contentSearch'))
  // 插件列表的折叠态（summary）里不渲染卡片正文，避免占位挤掉官方摘要行
  if (p.view === 'summary') return null
  return createElement(
    'div',
    { className: 'dsho-cfg' },
    createElement(PrefRow, {
      label: '侧栏入口',
      desc: '左侧栏显示全景概览格子（改动后需刷新页面）',
      on: sidebar,
      onChange: (next: boolean) => {
        setSidebar(next)
        writePref('sidebarEntry', next)
      },
    }),
    createElement(PrefRow, {
      label: '正文检索',
      desc: '搜索框按需扫描转录正文（只读，不发网络请求、不激活会话）',
      on: search,
      onChange: (next: boolean) => {
        setSearch(next)
        writePref('contentSearch', next)
      },
    }),
    createElement(
      'div',
      { className: 'dsho-cfg-hint' },
      '开关只存本机偏好（localStorage），不写宿主配置；卸载插件即彻底失效。',
    ),
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
    style.id = 'dsh-overview-style'
    style.setAttribute('data-plugin', 'dsh-overview')
    style.textContent = themeCss
    document.head.appendChild(style)
    return () => style.remove()
  }, 'dsh-overview theme')

  // 「运行中」真源：官方客户端会话快照（ctx.sessions.list），与官方侧栏同一份数据。
  // 宿主侧 SessionStore.list() 在常驻 webServer 里恒为空，见 liveness.ts 注释。
  ctx.effect(() => {
    const sessions = (ctx as unknown as Record<string, unknown>)['sessions'] as
      | { list?: SessionListSource }
      | undefined
    return bindSessionLiveness(sessions?.list ?? null)
  }, 'dsh-overview liveness')

  // 左侧栏格子：一枚小图标（对齐官方行高与图标规格）
  // 关掉入口时连 slot 一起不注册——留着隐藏容器只会在侧栏里占一格空气。
  if (readPref('sidebarEntry')) {
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register(
        { name: 'sidebar.panellist', id: 'overview', order: 2, label: '全景概览' },
        () => createElement(SidebarIcon),
      ),
    )
  }

  // 主区域整页面板：key 与侧栏格子的 id 对应，点击格子即点亮
  ctx.slots.inject('main', () =>
    ctx.slots.register({ name: 'main', key: 'overview' }, () =>
      createElement(
        'div',
        { style: { height: '100%', overflow: 'auto' }, 'data-dsh-overview': 'page' },
        createElement(WorkbenchApp, { getUiWorkspace, getWorkspaces }),
      ),
    ),
  )

  // 续接草稿注入器：常驻会话输入框 dock（Q5）
  ctx.slots.inject('conversation.input.dock', () =>
    ctx.slots.register(
      { name: 'conversation.input.dock', id: 'overview-resume-draft', order: 100 },
      (props?: unknown) => createElement(ResumeDraftInjector, (props ?? {}) as DockProps),
    ),
  )

  // 插件详情卡：不在则静默跳过（能力探测，不假设 slot 一定存在）
  ctx.slots.inject('plugins.bundle.config', () =>
    ctx.slots.register(
      { name: 'plugins.bundle.config', key: 'dsh-overview' },
      (props?: unknown) => createElement(BundleConfigCard, (props ?? {}) as Record<string, unknown>),
    ),
  )
}
