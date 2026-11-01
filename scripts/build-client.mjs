/**
 * client half 构建：esbuild bundle → 标准 CJS → 自包 __ModuleLoader__.load。
 *
 * 契约（2026-11-01 确认，dsh-pet 为活样本）：client.js 必须自包裹——
 *   window.__ModuleLoader__.load({ id: "<pkg>", factory: (require) => {...} })
 * 工厂内 module.exports 即 cordis 插件（exports.apply/inject），工厂由宿主
 * 模块系统以 require 注入调用；require("react") 由注册表解析。
 * 不自包裹的代码会裸落进 /plugins/?? 聚合脚本顶层 → 整包 SyntaxError。
 */
import { build } from 'esbuild'
import { writeFile, readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkgName = 'dsh-overview'
const outFile = join(root, 'lib/client.js')

const result = await build({
  entryPoints: [join(root, 'src/client/plugin.tsx')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react', 'react/jsx-runtime', 'react-dom'],
  logLevel: 'silent',
})

const body = result.outputFiles[0].text
// esbuild CJS 产物引用 `module`；工厂里提供 module/exports，并按宿主惯例返回 module.exports
const wrapped = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(pkgName)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
${body}
\t\treturn module.exports;
\t}
});
`

await writeFile(outFile, wrapped, 'utf-8')

const out = await readFile(outFile, 'utf-8')
const checks = {
  selfWrapped: out.includes('window.__ModuleLoader__.load'),
  hasId: out.includes(`"id": ${JSON.stringify(pkgName)}`) || out.includes(`id: ${JSON.stringify(pkgName)}`),
  reactRequire: /require\("react"\)/.test(out),
  returnsExports: /return module\.exports;/.test(out),
  noEsmImport: !/^import /m.test(out),
}
console.log(`client half → ${relative(root, outFile)} (${out.length} B)`, JSON.stringify(checks))
if (Object.values(checks).some((v) => !v)) {
  console.error(out.slice(0, 300))
  throw new Error('client half 产物形态校验失败')
}
