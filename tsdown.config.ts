import { defineConfig } from 'tsdown'

/**
 * 宿主侧打包：lib/index.js（cordis 插件，ESM）。
 *
 * client half 不走 tsdown：宿主 evaluateClientHalf 的产物契约是
 * 「无 import/export 的纯脚本 + 顶层 return 插件」，由
 * scripts/build-client.mjs 用 esbuild transform + 拼接生成
 * （tsdown 的 treeshake 会剃掉 footer 引用的 plugin，jsx classic 选项未生效）。
 */
export default defineConfig({
  entry: { index: 'src/host/index.ts' },
  outDir: 'lib',
  format: 'esm',
  outExtensions: () => ({ js: '.js' }),
  platform: 'node',
  dts: false,
})
