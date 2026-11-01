import { readFileSync, readdirSync } from 'node:fs'
const archDir = 'C:/Users/yolo/.dsh/storages/session_projcache_archive_manager_v2/sessions'
console.log('archive cache:', readdirSync(archDir).length)
const ws = JSON.parse(readFileSync('C:/Users/yolo/.dsh/storages/workspace.json', 'utf-8'))
const edict = Object.values(ws.tables.workspaces).find((w) => w.title === 'dsh-edict')
console.log('dsh-edict sessionIds:', edict.sessionIds.length, '| has acde228a:', edict.sessionIds.includes('session-acde228a-03c9-4c3e-8619-806525807dc4'))
const j = JSON.parse(readFileSync(process.env.TEMP + '/wb-live2.json', 'utf-8'))
const ed = j.projects.find((p) => p.title === 'dsh-edict')
console.log('state dsh-edict hist:', ed.sessions.filter((s) => !s.archived).length, 'arch:', ed.sessions.filter((s) => s.archived).length)
