# Agent Note: empty-shell-sessions

Status: implemented

## Problem

在宿主里新建会话、不输入任何内容就切到别的会话：宿主会把这个会话从它的列表里摘掉，但磁盘上的转录目录仍然存在（实测 318 B / 4 行：头 + permission/preset + sandbox/mode + approval/*，没有一条消息）。全景概览以磁盘为准，于是列表里一直挂着宿主自己都不再列出的空会话，用户看到两边不一致，也不知道能不能删。

## Decision

`SessionMeta.empty` 由 `probeSessionFile()`（`src/model/sources.ts`，替代原来的 `readSessionTitleFallback` 主体）判定：流式扫前 2 MB，只有当（a）读到文件末尾 `complete`、（b）全程没出现以 `{"type":"user/message"` 或 `{"type":"assistant/message"` 开头的行，才置 `empty: true`。命中扫描上限一律算「未知」，不回退成「空」。构建时只对无 projcache 标题的 live 会话跑 probe（原来的兜底路径不变，probe 顺带给出 hasMessages）。

界面三分：会话行加「空壳」标签（`wb-tag is-empty`，带 title 说明成因）；筛选菜单加「空壳会话」过滤项和「清理空壳会话（N）」动作（走已有 `deleteSessionsBatch`，排除运行中与已归档，删除前仍有 confirm）；右栏变更卡报「N 个空壳会话可清理」。插件不自动删、不在列表里隐藏，也不去改宿主 `workspace.json` 的成员表——已知悬空 id 对宿主无损（宿主按文件存在性过滤），而改文件会被宿主下次写入覆盖（v0.1.14 已实测）。

## Consequences

代价：每个无标题会话多一次「扫到文件末尾」的成本（不再命中标题就提前返回），实测 44 个转录的全量构建仍在百毫秒级；判定要读完整个文件才能说「没有消息」，2 MB 以上的会话直接放弃判定（宁可漏判）。收益：磁盘与用户看到的事实一致，且给出可执行的处置（一键清理），不再把「宿主明明没有这个会话」的不一致留给用户自己解释。覆盖缺口：`empty` 只对 live 会话计算，归档/仅缓存记录恒为 false；空壳会话仍计入「会话总数」KPI（不粉饰数字）；如果宿主将来改成「切走即删目录」，这套判定会自动失去对象，不需要回滚。

