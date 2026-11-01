/**
 * 渲染端 React 接入垫片。
 *
 * client half 由宿主服务端包进 __ModuleLoader__.load({factory:(require)=>{...}})
 * 的 CJS 注册表，require("react") 由注册表解析（dsh-better-sidebar 同款）。
 * 本文件只允许在 client 打包入口的依赖图里使用（宿主侧/Node 侧禁用）。
 * JSX 走 classic 编译（React.createElement 引用本模块作用域的 React）。
 */
declare function require(id: string): unknown

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
const React = require('react') as typeof import('react')

export const useState = React.useState
export const useEffect = React.useEffect
export const useMemo = React.useMemo
export const useCallback = React.useCallback
export const useRef = React.useRef
export const useSyncExternalStore = React.useSyncExternalStore
export const createElement = React.createElement.bind(React)
