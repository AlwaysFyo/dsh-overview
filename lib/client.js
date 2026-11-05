window.__ModuleLoader__.load({
	id: "dsh-overview",
	factory: (require) => {
		var module = { exports: {} };
"use strict";var Xe=Object.defineProperty;var cn=Object.getOwnPropertyDescriptor;var pn=Object.getOwnPropertyNames;var bn=Object.prototype.hasOwnProperty;var un=(t,n)=>{for(var o in n)Xe(t,o,{get:n[o],enumerable:!0})},wn=(t,n,o,i)=>{if(n&&typeof n=="object"||typeof n=="function")for(let l of pn(n))!bn.call(t,l)&&l!==o&&Xe(t,l,{get:()=>n[l],enumerable:!(i=cn(n,l))||i.enumerable});return t};var hn=t=>wn(Xe({},"__esModule",{value:!0}),t);var qn={};un(qn,{apply:()=>Ln,inject:()=>Pn,name:()=>Dn});module.exports=hn(qn);var he=require("react"),y=he.useState,L=he.useEffect,U=he.useMemo,_n=he.useCallback,Me=he.useRef,De=he.useSyncExternalStore,F=he.createElement.bind(he);var P=Date.now(),ve=36e5,Y=24*ve;function re(t){return{title:null,cwd:null,createdAt:P-3*Y,lastPromptAt:null,lastActivityAt:P-2*ve,turns:1,tokenTotals:null,todos:[],archived:!1,source:"live",dirName:null,origin:null,parentSession:null,derived:!1,sizeBytes:null,empty:!1,...t}}function Ne(t){return{workspaceId:null,existsOnDisk:!0,sessions:[],lastActivityAt:null,staleCwds:[],...t}}function gt(){let t=Ne({id:"ws-osuply",path:"D:\\Projects\\osuply",title:"osuply",workspaceId:"ws-osuply",staleCwds:["D:\\Projects\\osuply-old"],sessions:[re({id:"s-1",title:"\u91CD\u6784 osuply \u90E8\u7F72\u811A\u672C",cwd:"D:\\Projects\\osuply",lastActivityAt:P-18e5,turns:14,tokenTotals:{uncachedInputTokens:486e3,outputTokens:61e3,cacheReadTokens:0,cacheWriteTokens:0},todos:[{content:"\u62C6\u5206 deploy \u4E0E rollback \u4E24\u4E2A\u5B50\u547D\u4EE4",status:"in_progress"},{content:"\u8865 README \u90E8\u7F72\u7AE0\u8282\u7684\u5931\u8D25\u56DE\u6EDA\u8BF4\u660E",status:"pending"},{content:"\u786E\u8BA4 Node 24 \u4E0B pnpm \u7248\u672C\u9501\u5B9A",status:"completed"}]}),re({id:"s-2",title:"\u6392\u67E5 pnpm \u89E3\u6790\u62A5\u9519",cwd:"D:\\Projects\\osuply",lastActivityAt:P-26*ve,turns:3,todos:[{content:"\u590D\u73B0 hoisted \u6A21\u5F0F\u4E0B\u7684 peer \u51B2\u7A81",status:"pending"}]}),re({id:"s-3",title:"\u8FC1\u79FB CI \u7F13\u5B58\u5230\u672C\u5730",cwd:"D:\\Projects\\osuply",lastActivityAt:P-3*Y,turns:9}),re({id:"s-4",title:"\u6574\u7406 README \u90E8\u7F72\u7AE0\u8282",cwd:"D:\\Projects\\osuply-old",lastActivityAt:P-5*Y,turns:5})]});t.lastActivityAt=P-30*6e4;let n=Ne({id:"ws-onenote",path:"D:\\Blogs\\OneNote",title:"OneNote",workspaceId:"ws-onenote",sessions:[re({id:"s-5",title:"\u5BF9\u6BD4 Web Fetch \u4E0E Markdown \u8F6C\u6362\u6280\u80FD",cwd:"D:\\Blogs\\OneNote",lastActivityAt:P-20*ve,turns:12,tokenTotals:{uncachedInputTokens:116e4,outputTokens:213e3,cacheReadTokens:0,cacheWriteTokens:0}}),re({id:"s-6",title:"Image \u91CD\u547D\u540D",cwd:"D:\\Blogs\\OneNote",lastActivityAt:P-6*Y,turns:53})]});n.lastActivityAt=P-20*ve;let o=Ne({id:"ws-fairy",path:"D:\\Projects\\dsh-fairy",title:"dsh-fairy",workspaceId:"ws-fairy",sessions:[re({id:"s-7",title:"\u7EDD\u533A\u96F6 Fairy \u63D2\u4EF6\u590D\u523B\u4E0E\u6837\u5F0F\u8C03\u4F18",cwd:"D:\\Projects\\dsh-fairy",lastActivityAt:P-6*Y,turns:62,tokenTotals:{uncachedInputTokens:6859e3,outputTokens:1628e3,cacheReadTokens:0,cacheWriteTokens:0}})]});o.lastActivityAt=P-6*Y;let i=Ne({id:"ws-dead",path:"D:\\Projects\\moved-away",title:"moved-away",workspaceId:"ws-dead",existsOnDisk:!1,sessions:[re({id:"s-8",title:"\u88AB\u79FB\u52A8\u524D\u7684\u6700\u540E\u4F1A\u8BDD",cwd:"D:\\Projects\\moved-away",lastActivityAt:P-12*Y,turns:4})]});i.lastActivityAt=P-12*Y;let l=Ne({id:"ws-imageDedup",path:"D:\\Projects\\ToolCube\\imageDedup",title:"imageDedup",workspaceId:"ws-imageDedup",archived:!0,archivedAt:P-9*Y,sessions:[re({id:"s-9",title:"\u7CFB\u7EDF\u6027\u7684\u5206\u6790\u4E00\u4E0B\u5F53\u524D\u9879\u76EE",cwd:"D:\\Projects\\ToolCube\\imageDedup",lastActivityAt:P-20*Y,turns:115,archived:!0,source:"archive"}),re({id:"s-10",title:"\u53BB\u91CD\u7B97\u6CD5 spike",cwd:"D:\\Projects\\ToolCube\\imageDedup",lastActivityAt:P-21*Y,turns:8,archived:!0,source:"archive"})]});l.lastActivityAt=P-20*Y;let b=Ne({id:"orphan:c:\\users\\yolo\\.dsh",path:"C:\\Users\\yolo\\.dsh",title:".dsh",sessions:[re({id:"s-11",title:"\u6237\u90E8\u5C1A\u4E66\u627F\u529E\u6570\u636E\u7EDF\u8BA1\u65E8\u610F",cwd:"C:\\Users\\yolo\\.dsh",lastActivityAt:P-30*ve,turns:1})]});return b.lastActivityAt=P-30*ve,{generatedAt:P,projects:[t,n,o,i,l,b],warnings:[],diagnostics:{cacheIssues:[{kind:"no-record",sessionId:"s-11",title:null,cwd:"C:\\Users\\yolo\\.dsh"},{kind:"no-title",sessionId:"s-8",title:null,cwd:"D:\\Projects\\moved-away"}],unclaimed:[{sessionId:"edict-7f3c",title:"\u5B50\u4EE3\u7406\uFF1A\u7EDF\u8BA1\u672C\u673A\u8F6C\u5F55",cwd:"C:\\Users\\yolo\\.dsh",createdAt:P-4*Y,origin:"subagent",sizeBytes:124e4,dirName:"edict-7f3c",pathRegistered:!1},{sessionId:"edict-91be",title:null,cwd:"D:\\Projects\\osuply",createdAt:P-11*Y,origin:"subagent",sizeBytes:96e3,dirName:"edict-91be",pathRegistered:!0}],staleArchiveRecords:2}}}var xe=typeof location<"u"&&location.pathname.startsWith("/web/"),mt=async()=>{if(xe)return gt();let t=await fetch("/dsh-overview/state",{cache:"no-store"});if(!t.ok)throw new Error(`state ${t.status}`);return await t.json()},Pe=typeof location<"u"&&!location.pathname.startsWith("/web/");async function ft(t){if(xe)return{ok:!0,deleted:!0};let n=await fetch("/dsh-overview/session/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId:t})}),o;try{o=await n.json()}catch{o={ok:!1,error:`delete ${n.status}`}}if(!n.ok||!o.ok)throw new Error(o.error??`delete ${n.status}`);return o}async function vt(t,n={}){if(xe)return{ok:!0,query:t,hits:[],scanned:0,skipped:[],truncated:!1};let o=await fetch("/dsh-overview/search",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:t,...n.sessionIds?{sessionIds:n.sessionIds}:{},...n.limit?{limit:n.limit}:{}}),signal:n.signal}),i;try{i=await o.json()}catch{i={ok:!1,query:t,hits:[],scanned:0,skipped:[],truncated:!1,error:`search ${o.status}`}}if(!o.ok||!i.ok)throw new Error(i.error??`search ${o.status}`);return i}async function xt(t,n="",o){if(xe)return{ok:!0,sessionId:t,messages:[],scanned:0};let i=await fetch("/dsh-overview/preview",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId:t,query:n}),signal:o}),l;try{l=await i.json()}catch{l={ok:!1,sessionId:t,messages:[],scanned:0,error:`preview ${i.status}`}}if(!i.ok||!l.ok)throw new Error(l.error??`preview ${i.status}`);return l}async function $e(t){if(xe)return{ok:!0,requested:t.length,succeeded:[...t],skipped:[],failures:[],remaining:[]};let n=await fetch("/dsh-overview/session/batch",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ids:t})}),o;try{o=await n.json()}catch{o={ok:!1,requested:t.length,succeeded:[],skipped:[],failures:[],remaining:[...t],error:`batch ${n.status}`}}if(!n.ok)throw new Error(o.error??`batch ${n.status}`);return o}async function Je(t,n,o={}){if(xe)return{ok:!0,changed:!0,aliases:{}};let i=await fetch("/dsh-overview/session/adopt",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({workspaceId:t,cwd:n,forget:o.forget===!0})}),l;try{l=await i.json()}catch{l={ok:!1,error:`adopt ${i.status}`}}if(!i.ok||!l.ok)throw new Error(l.error??`adopt ${i.status}`);return l}async function kt(t,n){if(xe)return{ok:!0,requested:n.length,succeeded:[...n],skipped:[],failures:[],remaining:[]};let o=await fetch("/dsh-overview/session/migrate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({workspaceId:t,sessionIds:[...n]})}),i;try{i=await o.json()}catch{i={ok:!1,requested:0,succeeded:[],skipped:[],failures:[],remaining:[],error:`migrate ${o.status}`}}if(!o.ok)throw new Error(i.error??`migrate ${o.status}`);return i}var yt=2*36e5;function Ee(t,n=Date.now(),o){let i=o?new Set(o):null,l=[],b=[],c=[];for(let v of t.sessions)v.archived?c.push(v):(i?i.has(v.id):v.lastActivityAt!==null&&n-v.lastActivityAt<=yt)?l.push(v):b.push(v);return{running:l,history:b,archived:c}}function Nt(t,n=Date.now(),o){if(t.archived)return"quiet";if(o){if(t.sessions.some(b=>!b.archived&&o.includes(b.id)))return"running";let l=t.lastActivityAt;return l!==null&&n-l<=168*36e5?"idle":"quiet"}let i=t.lastActivityAt;return i!==null&&n-i<=yt?"running":i!==null&&n-i<=168*36e5?"idle":"quiet"}function Ye(t){return t.todos.filter(n=>n.status!=="completed").length}function Re(t){return t.sessions.reduce((n,o)=>n+Ye(o),0)}function Le(t,n=20){let o=[];for(let i of t.sessions)for(let l of i.todos)l.status!=="completed"&&o.push({sessionId:i.id,sessionTitle:i.title,content:l.content,status:l.status});return o.sort((i,l)=>(i.status==="in_progress"?-1:0)-(l.status==="in_progress"?-1:0)),o.slice(0,n)}function ne(t,n=Date.now()){if(t===null)return"\u2014";let o=n-t;if(o<0)return"\u521A\u521A";let i=Math.floor(o/6e4);if(i<1)return"\u521A\u521A";if(i<60)return`${i} \u5206\u949F\u524D`;let l=Math.floor(i/60);if(l<24)return`${l} \u5C0F\u65F6\u524D`;let b=Math.floor(l/24);if(b<30)return`${b} \u5929\u524D`;let c=new Date(t);return`${String(c.getMonth()+1).padStart(2,"0")}-${String(c.getDate()).padStart(2,"0")}`}function qe(t,n=Date.now()){if(t==null)return"\u2014";let o=n-t;return o<6e4?"\u521A\u521A":o<36e5?"\u51E0\u5206\u949F\u524D":o<24*36e5?"\u51E0\u5C0F\u65F6\u524D":"\u51E0\u5929\u524D"}var gn={ready:!1,ids:[]},Ct=gn,St="",Ze=new Set;function At(t){let n=`${t.ready?1:0}|${t.ids.join("\0")}`;if(n!==St){St=n,Ct=t;for(let o of[...Ze])try{o()}catch{}}}function It(t){return Ze.add(t),()=>{Ze.delete(t)}}function Mt(){return Ct}function mn(t){let n=t?.byId;if(!n||typeof n!="object")return[];let o=[];for(let i of Object.values(n)){if(!i||typeof i.id!="string")continue;let l=typeof i.runningSubagentCount=="number"?i.runningSubagentCount:0;(i.running===!0||l>0||i.pendingInteraction!=null)&&o.push(i.id)}return o.sort()}function Tt(t){if(!t||typeof t.getSnapshot!="function"||typeof t.subscribe!="function")return()=>{};let n=()=>{try{At({ready:!0,ids:mn(t.getSnapshot())})}catch{At({ready:!0,ids:[]})}};n();let o;try{o=t.subscribe(n)}catch{return()=>{}}return()=>{try{typeof o=="function"&&o()}catch{}}}var Qe="dshw-prefs",zt={sidebarEntry:"dshw-sidebar-entry",contentSearch:"dshw-content-search"};function Dt(){try{return typeof localStorage>"u"?null:localStorage}catch{return null}}function ke(t){return Dt()?.getItem(zt[t])!=="0"}function et(t,n){try{Dt()?.setItem(zt[t],n?"1":"0")}catch{}try{typeof window<"u"&&window.dispatchEvent(new Event(Qe))}catch{}}function Pt(t){return typeof window>"u"?()=>{}:(window.addEventListener(Qe,t),()=>window.removeEventListener(Qe,t))}function $t(t,n,o=24){let i=n.trim().toLowerCase();if(!i)return[];let l=new Map,b=0;for(let c of t.projects){let v=[];c.title.toLowerCase().includes(i)&&v.push({kind:"project",projectId:c.id,projectTitle:c.title,sessionId:null,sessionTitle:null,text:c.title});for(let S of c.sessions){S.title&&S.title.toLowerCase().includes(i)&&v.push({kind:"session",projectId:c.id,projectTitle:c.title,sessionId:S.id,sessionTitle:S.title,text:S.title});for(let T of S.todos)T.content.toLowerCase().includes(i)&&v.push({kind:"todo",projectId:c.id,projectTitle:c.title,sessionId:S.id,sessionTitle:S.title,text:T.content})}if(v.length===0)continue;let k=o-b;if(k<=0)break;let w=v.slice(0,k);if(l.set(c.id,{projectId:c.id,projectTitle:c.title,hits:w}),b+=w.length,l.size>=8)break}return[...l.values()]}function Et(t,n){let o=new Map;for(let l of t.projects)for(let b of l.sessions)o.set(b.id,{projectId:l.id,projectTitle:l.title,sessionTitle:b.title});let i=new Map;for(let l of n){let b=o.get(l.sessionId),c=b?.projectId??"unclaimed",v=b?.projectTitle??"\u672A\u5F52\u5C5E\u4F1A\u8BDD",k=i.get(c)??{projectId:c,projectTitle:v,hits:[]};k.hits.push({kind:"content",projectId:c,projectTitle:v,sessionId:l.sessionId,sessionTitle:b?.sessionTitle??null,text:l.snippet,seq:l.seq,role:l.role,ranges:l.ranges}),i.set(c,k)}return[...i.values()]}function We(t,n){let o=n.trim();if(!o)return[{text:t,hit:!1}];let i=[],l=t.toLowerCase(),b=o.toLowerCase(),c=0;for(;c<t.length;){let v=l.indexOf(b,c);if(v===-1){i.push({text:t.slice(c),hit:!1});break}v>c&&i.push({text:t.slice(c,v),hit:!1}),i.push({text:t.slice(v,v+o.length),hit:!0}),c=v+o.length}return i}function Rt(t,n){if(!n||n.length===0)return[{text:t,hit:!1}];let o=[],i=0;for(let[l,b]of n)l<i||b<=l||b>t.length||(l>i&&o.push({text:t.slice(i,l),hit:!1}),o.push({text:t.slice(l,b),hit:!0}),i=b);return i<t.length&&o.push({text:t.slice(i),hit:!1}),o}var tt=new Map,nt=0,_e=new Set;function Oe(t,n){tt.set(t,{text:n}),nt+=1;for(let o of _e)o()}function Lt(t){let n=tt.get(t);if(n==null)return null;tt.delete(t),nt+=1;for(let o of _e)o();return n}function qt(t){return _e.add(t),()=>_e.delete(t)}function Wt(){return nt}function _t(t){return[`\u8BF7\u7EED\u63A5\u4F1A\u8BDD ${t.id}\u300A${t.title??"\u65E0\u6807\u9898"}\u300B\u3002`,t.cwd?`\u9879\u76EE\u76EE\u5F55\uFF1A${t.cwd}`:null,`\u8F6E\u6B21\uFF1A${t.turns??"\u672A\u77E5"}\uFF1B\u6700\u540E\u6D3B\u52A8\uFF1A${t.lastActivityAt?new Date(t.lastActivityAt).toLocaleString():"\u672A\u77E5"}\u3002`,"\u8BF7\u5148\u6062\u590D\u8BE5\u4F1A\u8BDD\u7684\u4E0A\u4E0B\u6587\uFF08\u53EF\u7528\u4F1A\u8BDD\u641C\u7D22\u6216\u8BFB\u53D6\u4F1A\u8BDD\u8BB0\u5F55\uFF09\uFF0C\u7136\u540E\u4ECE\u4E2D\u65AD\u5904\u7EE7\u7EED\uFF0C\u4E0D\u8981\u91CD\u590D\u5DF2\u5B8C\u6210\u7684\u5DE5\u4F5C\u3002"].filter(Boolean).join(`
`)}var at="dsho-manual-todos";function ot(){try{return typeof localStorage>"u"?null:localStorage}catch{return null}}function fn(){try{if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID()}catch{}return`m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}function Se(t){let n=ot();if(!n)return[];try{let o=n.getItem(at);if(!o)return[];let l=JSON.parse(o)?.[t];return Array.isArray(l)?l.filter(b=>!!b&&typeof b.id=="string"&&typeof b.text=="string"&&typeof b.createdAt=="number"):[]}catch{return[]}}var st="dsho-manual-todos";function vn(){try{typeof window<"u"&&window.dispatchEvent(new Event(st))}catch{}}function Ot(t){try{return typeof window>"u"?()=>{}:(window.addEventListener(st,t),()=>window.removeEventListener(st,t))}catch{return()=>{}}}function it(t){let n=ot();if(n)try{n.setItem(at,JSON.stringify(t)),vn()}catch{}}function rt(){let t=ot();if(!t)return{};try{let n=t.getItem(at);if(!n)return{};let o=JSON.parse(n);return o&&typeof o=="object"?o:{}}catch{return{}}}function jt(t,n){let o=n.trim().slice(0,200);if(!o)return Se(t);let i=rt(),l=Array.isArray(i[t])?i[t]:[],b=[{id:fn(),text:o,done:!1,createdAt:Date.now()},...l].slice(0,200);return i[t]=b,it(i),b}function je(t,n){let o=rt(),i=Array.isArray(o[t])?o[t]:[];return o[t]=i.map(l=>l.id===n?{...l,done:!l.done}:l),it(o),o[t]}function He(t,n){let o=rt(),i=Array.isArray(o[t])?o[t]:[];return o[t]=i.filter(l=>l.id!==n),it(o),o[t]}var e=require("react/jsx-runtime"),xn={"folder-plus":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"}),(0,e.jsx)("path",{d:"M12 10v6"}),(0,e.jsx)("path",{d:"M9 13h6"})]}),activity:(0,e.jsx)("path",{d:"M22 12h-4l-3 9L9 3l-3 9H2"}),history:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}),(0,e.jsx)("path",{d:"M3 3v5h5"}),(0,e.jsx)("path",{d:"M12 7v5l4 2"})]}),"list-todo":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"3",y:"4",width:"18",height:"16",rx:"2"}),(0,e.jsx)("path",{d:"M8 9h8"}),(0,e.jsx)("path",{d:"M8 14h5"})]}),"alert-triangle":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20.99h16a2 2 0 0 0 1.73-3Z"}),(0,e.jsx)("path",{d:"M12 9v4"}),(0,e.jsx)("path",{d:"M12 17h.01"})]}),"arrow-right":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M5 12h14"}),(0,e.jsx)("path",{d:"m12 5 7 7-7 7"})]}),"arrow-left":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M19 12H5"}),(0,e.jsx)("path",{d:"m12 19-7-7 7-7"})]}),"arrow-up":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"m5 12 7-7 7 7"}),(0,e.jsx)("path",{d:"M12 19V5"})]}),"chevron-up":(0,e.jsx)("path",{d:"m18 15-6-6-6 6"}),"chevron-down":(0,e.jsx)("path",{d:"m6 9 6 6 6-6"}),check:(0,e.jsx)("path",{d:"M20 6 9 17l-5-5"}),sun:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("circle",{cx:"12",cy:"12",r:"4"}),(0,e.jsx)("path",{d:"M12 2v2"}),(0,e.jsx)("path",{d:"M12 20v2"}),(0,e.jsx)("path",{d:"M2 12h2"}),(0,e.jsx)("path",{d:"M20 12h2"}),(0,e.jsx)("path",{d:"m4.9 4.9 1.4 1.4"}),(0,e.jsx)("path",{d:"m17.7 17.7 1.4 1.4"}),(0,e.jsx)("path",{d:"m6.3 17.7-1.4 1.4"}),(0,e.jsx)("path",{d:"m19.1 4.9-1.4 1.4"})]}),moon:(0,e.jsx)("path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"}),"more-horizontal":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("circle",{cx:"5",cy:"12",r:"1"}),(0,e.jsx)("circle",{cx:"12",cy:"12",r:"1"}),(0,e.jsx)("circle",{cx:"19",cy:"12",r:"1"})]}),"corner-up-right":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M4 12h11"}),(0,e.jsx)("path",{d:"m11 8 4 4-4 4"})]}),eye:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"}),(0,e.jsx)("circle",{cx:"12",cy:"12",r:"2.5"})]}),archive:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"3",y:"4",width:"18",height:"4",rx:"1"}),(0,e.jsx)("path",{d:"M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"}),(0,e.jsx)("path",{d:"M10 13h4"})]}),unarchive:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"3",y:"4",width:"18",height:"4",rx:"1"}),(0,e.jsx)("path",{d:"M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"}),(0,e.jsx)("path",{d:"M12 17v-5"}),(0,e.jsx)("path",{d:"m9.5 14.5 2.5-2.5 2.5 2.5"})]}),trash:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M3 6h18"}),(0,e.jsx)("path",{d:"M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"}),(0,e.jsx)("path",{d:"M6 6l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"})]}),"file-text":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"}),(0,e.jsx)("path",{d:"M14 2v4a2 2 0 0 0 2 2h4"}),(0,e.jsx)("path",{d:"M10 9H8"}),(0,e.jsx)("path",{d:"M16 13H8"}),(0,e.jsx)("path",{d:"M16 17H8"})]}),"layout-grid":(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1"}),(0,e.jsx)("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1"}),(0,e.jsx)("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1"}),(0,e.jsx)("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1"})]}),list:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M8 6h13"}),(0,e.jsx)("path",{d:"M8 12h13"}),(0,e.jsx)("path",{d:"M8 18h13"}),(0,e.jsx)("path",{d:"M3 6h.01"}),(0,e.jsx)("path",{d:"M3 12h.01"}),(0,e.jsx)("path",{d:"M3 18h.01"})]})};function z({name:t,size:n=16,className:o}){return(0,e.jsx)("svg",{viewBox:"0 0 24 24",width:n,height:n,fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",className:o?`wb-ic ${o}`:"wb-ic",children:xn[t]})}var Ht=["#8046f3","#3586ff","#10a893","#47b382","#25b0e7","#e8a33d","#7e53ff"];function kn(t){let n=0;for(let o=0;o<t.length;o++)n=n*31+t.charCodeAt(o)>>>0;return Ht[n%Ht.length]}function Be(t){let n=c=>c<=.03928?c/12.92:((c+.055)/1.055)**2.4,[o,i,l]=[1,3,5].map(c=>n(parseInt(t.slice(c,c+2),16)/255));return 1.05/(.2126*o+.7152*i+.0722*l+.05)>=4.5?"#ffffff":"#181a1d"}var yn=168*36e5,Nn=10;function Bt({state:t,liveIds:n,onOpenProject:o,onOpenSession:i,getUiWorkspace:l,onOpenDiagnostics:b}){let c=Date.now(),[v,k]=y(0);L(()=>Ot(()=>k(s=>s+1)),[]);let w=U(()=>t.projects.map(s=>{let d=Se(s.id).filter(_=>!_.done),C=s.sessions.reduce((_,fe)=>!_||(fe.lastActivityAt??0)>(_.lastActivityAt??0)?fe:_,null);return{p:s,color:kn(s.id),tile:s.title.charAt(0).toUpperCase(),liveness:Nt(s,c,n??null),activeCount:s.sessions.filter(_=>!_.archived).length,archivedCount:s.sessions.filter(_=>_.archived).length,todoTotal:Re(s)+d.length,manualCount:d.length,latest:C,groups:Ee(s,c,n??null)}}),[t,n,v]),S=U(()=>w.filter(s=>!s.p.archived).flatMap(s=>s.groups.running.map(d=>({s:d,p:s.p,color:s.color}))).sort((s,d)=>(d.s.lastActivityAt??0)-(s.s.lastActivityAt??0)),[w]),T=U(()=>new Set(S.map(s=>s.s.id)),[S]),A=U(()=>w.filter(s=>!s.p.archived).flatMap(s=>s.p.sessions.filter(d=>!d.archived&&d.lastActivityAt!==null&&c-d.lastActivityAt<=yn).map(d=>({s:d,p:s.p,color:s.color}))).sort((s,d)=>(d.s.lastActivityAt??0)-(s.s.lastActivityAt??0)),[w]),E=w.reduce((s,d)=>s+d.todoTotal,0),R=w.reduce((s,d)=>s+d.manualCount,0),K=t.diagnostics.cacheIssues.length+t.diagnostics.unclaimed.length,[u,p]=y("home");L(()=>{if(u==="home")return;let s=d=>{d.key==="Escape"&&p("home")};return document.addEventListener("keydown",s),()=>document.removeEventListener("keydown",s)},[u]);let[f,D]=y("active"),[ce,se]=y("grid"),pe=w.filter(s=>f==="all"?!0:f==="archived"?!!s.p.archived:!s.p.archived).sort((s,d)=>(d.p.lastActivityAt??0)-(s.p.lastActivityAt??0)),ge=w.reduce((s,d)=>s+d.p.sessions.length,0),[Z,ae]=y(""),[Q,ee]=y(!1),[j,be]=y(null),[le,G]=y(null),[ue,te]=y(""),H=Me(null),q=Me(null),me=[{id:"",label:"\u8DDF\u968F DSH \u9ED8\u8BA4"}],V=U(()=>w.filter(s=>!s.p.archived).sort((s,d)=>(d.p.lastActivityAt??0)-(s.p.lastActivityAt??0)),[w]);L(()=>{j&&V.some(s=>s.p.id===j)||be(V[0]?.p.id??null)},[V,j]),L(()=>{if(!Q)return;let s=d=>{q.current?.contains(d.target)||ee(!1)};return document.addEventListener("mousedown",s),()=>document.removeEventListener("mousedown",s)},[Q]),L(()=>{let s=H.current;!s||u!=="home"||(s.style.height="auto",s.style.height=`${Math.min(s.scrollHeight,132)}px`)},[Z,u]);let X=V.find(s=>s.p.id===j)??null,O=()=>{let s=Z.trim();if(!X){G("\u5F53\u524D\u6CA1\u6709\u53EF\u53D1\u8D77\u4F1A\u8BDD\u7684\u9879\u76EE");return}if(!s){G(`\u5148\u8F93\u5165\u4EFB\u52A1\u5185\u5BB9\uFF0C\u56DE\u8F66\u540E\u5728\u300C${X.p.title}\u300D\u4E2D\u6253\u5F00\u4F1A\u8BDD`);return}let d=l?.();if(!d?.openWorkspace){G("\u5BBF\u4E3B\u672A\u63D0\u4F9B\u65B0\u5EFA\u4F1A\u8BDD\u63A5\u53E3\uFF08dev \u6C99\u76D2\u65E0\u6B64\u670D\u52A1\uFF09\uFF0C\u65E0\u6CD5\u4ECE\u8FD9\u91CC\u53D1\u8D77\u4F1A\u8BDD");return}if(!X.p.workspaceId){G(`\u300C${X.p.title}\u300D\u6CA1\u6709\u767B\u8BB0\u5DE5\u4F5C\u533A\uFF08\u5B64\u513F\u9879\u76EE\uFF09\uFF0C\u65E0\u6CD5\u65B0\u5EFA\u4F1A\u8BDD`);return}G(null),d.openWorkspace(X.p.workspaceId,C=>Oe(C,s),ue?{agentPreset:ue}:void 0),ae("")},de=(s,d)=>{i?.(s)||o(d)},x=s=>s.p.archived?(0,e.jsx)("span",{className:"wb-badge dim",children:"\u5DF2\u5F52\u6863"}):s.p.existsOnDisk?null:(0,e.jsx)("span",{className:"wb-badge warn",children:"\u8DEF\u5F84\u5931\u6548"}),N=s=>s.liveness==="running"?"wb-dot-run":s.liveness==="idle"?"wb-dot-idle":"wb-dot-off",J=(s,d)=>(0,e.jsxs)("div",{className:"wb-subhead",children:[(0,e.jsx)("button",{type:"button",className:"wb-back-btn",onClick:()=>p("home"),"aria-label":"\u8FD4\u56DE\u4E3B\u5C4F",children:(0,e.jsx)(z,{name:"arrow-left",size:14})}),(0,e.jsx)("h2",{children:s}),(0,e.jsx)("span",{className:"hint num",children:d})]});return(0,e.jsxs)(e.Fragment,{children:[u!=="home"&&(0,e.jsx)("div",{className:"wb-sub",children:(0,e.jsx)("div",{className:"wb-main",children:(()=>{if(u==="running")return(0,e.jsxs)(e.Fragment,{children:[J("\u8FD0\u884C\u4E2D",`${S.length} \u6761\u4F1A\u8BDD\u6B63\u5728\u8FD0\u884C`),S.length===0?(0,e.jsx)("div",{className:"wb-empty-state",children:"\u5F53\u524D\u6CA1\u6709\u8FD0\u884C\u4E2D\u7684\u4F1A\u8BDD\u3002\u5728\u5BBF\u4E3B\u91CC\u5F00\u59CB\u4E00\u4E2A\u4F1A\u8BDD\u540E\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"}):S.map(({s,p:d})=>(0,e.jsxs)("button",{type:"button",className:"wb-runcard",onClick:()=>de(s.id,d.id),children:[(0,e.jsx)("span",{className:"breathe"}),(0,e.jsxs)("span",{className:"wb-runcard-main",children:[(0,e.jsx)("b",{children:s.title??"(\u65E0\u6807\u9898)"}),(0,e.jsxs)("span",{className:"num",children:[d.title," \xB7 \u8FD0\u884C ",ne(s.lastActivityAt)," \xB7 ",s.turns??0," \u8F6E \xB7 \u5F85\u529E ",Ye(s)]})]}),(0,e.jsx)("span",{className:"wb-openbtn",children:"\u6253\u5F00"})]},s.id))]});if(u==="continue"){let s=A.slice(0,Nn);return(0,e.jsxs)(e.Fragment,{children:[J("\u7EE7\u7EED\u5DE5\u4F5C",`\u6700\u8FD1 7 \u5929 \xB7 ${A.length} \u6761\u4F1A\u8BDD`),s.length===0?(0,e.jsx)("div",{className:"wb-empty-state",children:"\u6700\u8FD1 7 \u5929\u6CA1\u6709\u4F1A\u8BDD\u6D3B\u52A8\u3002"}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("div",{className:"wb-side-card is-tight",children:s.map(({s:d,p:C})=>(0,e.jsxs)("button",{type:"button",className:"wb-srow",onClick:()=>de(d.id,C.id),children:[(0,e.jsx)("span",{className:"wb-dot "+(T.has(d.id)?"wb-dot-run":"wb-dot-idle")}),(0,e.jsxs)("span",{className:"wb-srow-main",children:[(0,e.jsx)("span",{className:"t",children:d.title??"(\u65E0\u6807\u9898)"}),(0,e.jsxs)("span",{className:"sub",children:[C.title," \xB7 ",d.turns??0," \u8F6E"]})]}),(0,e.jsx)("span",{className:"m num",children:ne(d.lastActivityAt)})]},d.id))}),A.length>s.length&&(0,e.jsxs)("p",{className:"wb-listnote",children:["\u8FD8\u6709 ",A.length-s.length," \u6761\u66F4\u65E9\u7684 \xB7 \u7528\u9876\u680F\u641C\u7D22\u627E\u5B83\u4EEC"]})]})]})}if(u==="todos"){let s=w.map(d=>({r:d,host:Le(d.p),manual:Se(d.p.id)})).filter(d=>d.host.length>0||d.manual.length>0).sort((d,C)=>(C.r.p.lastActivityAt??0)-(d.r.p.lastActivityAt??0));return(0,e.jsxs)(e.Fragment,{children:[J("\u5F85\u529E",`${E} \u6761\u672A\u5B8C\u6210 \xB7 ${s.length} \u4E2A\u9879\u76EE \xB7 \u542B\u624B\u52A8 ${R} \u6761`),s.length===0?(0,e.jsx)("div",{className:"wb-empty-state",children:"\u6CA1\u6709\u672A\u5B8C\u6210\u7684\u5F85\u529E\u3002\u4F1A\u8BDD\u5185\u7684 todo \u8BB0\u5F55\u4F1A\u805A\u5408\u5230\u8FD9\u91CC\u3002"}):s.map(d=>(0,e.jsxs)("div",{className:"wb-side-card",children:[(0,e.jsxs)("h3",{children:[(0,e.jsx)("span",{className:"wb-mini sm",style:{background:d.r.color,color:Be(d.r.color)},children:d.r.tile}),d.r.p.title,(0,e.jsx)("span",{className:"cnt"+(d.host.length+d.manual.length?" hot":""),children:d.host.length+d.manual.length})]}),(0,e.jsxs)("div",{className:"wb-todo-feed",children:[d.host.map((C,_)=>(0,e.jsxs)("div",{className:"f is-click"+(C.status==="in_progress"?" is-run":""),onClick:()=>de(C.sessionId,d.r.p.id),title:"\u6253\u5F00\u6765\u6E90\u4F1A\u8BDD",children:[(0,e.jsx)("span",{className:"f-txt",children:C.content}),(0,e.jsx)("span",{className:"f-w",children:C.sessionTitle??"\u4F1A\u8BDD "+C.sessionId.slice(0,8)})]},`${C.sessionId}-${_}`)),d.manual.map(C=>(0,e.jsxs)("label",{className:"f f-manual"+(C.done?" is-done":""),children:[(0,e.jsx)("input",{type:"checkbox",checked:C.done,onChange:()=>{je(d.r.p.id,C.id),k(_=>_+1)}}),(0,e.jsx)("span",{className:"f-txt",children:C.text}),(0,e.jsx)("span",{className:"f-tag",children:"\u624B\u52A8"}),(0,e.jsx)("button",{type:"button",className:"f-del","aria-label":"\u5220\u9664\u8FD9\u6761\u624B\u52A8\u5F85\u529E",onClick:()=>{He(d.r.p.id,C.id),k(_=>_+1)},children:"\xD7"})]},C.id))]})]},d.r.p.id))]})}return null})()})},u),u==="home"&&(0,e.jsx)("div",{className:"wb-main",children:(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"wb-hero",children:[(0,e.jsxs)("div",{className:"wb-herobox",children:[(0,e.jsx)("textarea",{ref:H,rows:1,placeholder:"\u63CF\u8FF0\u8981\u7EE7\u7EED\u7684\u4EFB\u52A1\u6216\u95EE\u9898\uFF0C\u56DE\u8F66\u540E\u5728\u6240\u9009\u9879\u76EE\u4E2D\u6253\u5F00\u4F1A\u8BDD","aria-label":"\u4EFB\u52A1\u63CF\u8FF0",value:Z,onChange:s=>ae(s.target.value),onKeyDown:s=>{s.key==="Enter"&&!s.shiftKey&&!s.nativeEvent.isComposing&&(s.preventDefault(),O())}}),(0,e.jsxs)("div",{className:"wb-herorow",children:[(0,e.jsxs)("div",{className:"wb-pick",ref:q,children:[(0,e.jsxs)("button",{type:"button",className:"wb-pickbtn","aria-haspopup":"listbox","aria-expanded":Q,onClick:()=>ee(!Q),children:[X?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("span",{className:"wb-mini",style:{background:X.color,color:Be(X.color)},children:X.tile}),X.p.title]}):"\u9009\u62E9\u9879\u76EE",(0,e.jsx)(z,{name:"chevron-down",size:12})]}),Q&&(0,e.jsxs)("div",{className:"wb-pickmenu",role:"listbox","aria-label":"\u9009\u62E9\u9879\u76EE",children:[(0,e.jsx)("div",{className:"wb-pickcap",children:"\u5728\u54EA\u4E2A\u9879\u76EE\u4E2D\u7EE7\u7EED"}),V.map(s=>(0,e.jsxs)("button",{type:"button",className:"wb-pickitem",role:"option","aria-selected":s.p.id===j,onClick:()=>{be(s.p.id),ee(!1),H.current?.focus()},children:[(0,e.jsx)("span",{className:"wb-mini",style:{background:s.color,color:Be(s.color)},children:s.tile}),s.p.title,s.liveness==="running"&&(0,e.jsx)("span",{className:"wb-dot wb-dot-run"}),(0,e.jsxs)("span",{className:"n num",children:[s.activeCount," \u4F1A\u8BDD"]}),(0,e.jsx)(z,{name:"check",size:13,className:"ck"})]},s.p.id))]})]}),(0,e.jsxs)("span",{className:"wb-hint",children:["\u56DE\u8F66 \u21B5 \u5728 ",(0,e.jsx)("b",{children:X?.p.title??"\u2014"})," \u4E2D\u6253\u5F00\u4F1A\u8BDD"]}),(0,e.jsxs)("span",{className:"wb-sel",title:"\u6A21\u5F0F\u7531 DSH \u7684 agent preset \u51B3\u5B9A\uFF08cordis.patch.yml \u58F0\u660E\u540E\u8FD9\u91CC\u51FA\u73B0\u5BF9\u5E94\u9009\u9879\uFF09",children:[(0,e.jsx)("b",{children:"\u6A21\u5F0F"}),(0,e.jsx)("select",{value:ue,onChange:s=>te(s.target.value),"aria-label":"\u4F1A\u8BDD\u6A21\u5F0F",children:me.map(s=>(0,e.jsx)("option",{value:s.id,children:s.label},s.id))}),(0,e.jsx)(z,{name:"chevron-down",size:11})]}),(0,e.jsxs)("span",{className:"wb-sel",title:"\u5BBF\u4E3B\u53D1\u8D77\u4F1A\u8BDD\u7684\u63A5\u53E3\u6682\u4E0D\u652F\u6301\u6307\u5B9A\u6A21\u578B\uFF1B\u6A21\u578B\u8DDF\u968F DSH \u5168\u5C40\u9ED8\u8BA4\uFF0C\u53EF\u5728\u4F1A\u8BDD\u8F93\u5165\u6846\u91CC\u5207\u6362",children:[(0,e.jsx)("b",{children:"\u6A21\u578B"}),(0,e.jsx)("span",{className:"wb-sel-v",children:"DSH \u9ED8\u8BA4"})]}),(0,e.jsx)("button",{type:"button",className:"wb-send","aria-label":"\u6253\u5F00\u4F1A\u8BDD",onClick:O,children:(0,e.jsx)(z,{name:"arrow-up",size:14})})]})]}),le&&(0,e.jsxs)("div",{className:"wb-notebar",role:"status",onClick:()=>G(null),title:"\u70B9\u51FB\u5173\u95ED",children:[(0,e.jsx)(z,{name:"alert-triangle",size:14}),(0,e.jsx)("span",{children:le})]})]}),(0,e.jsxs)("section",{className:"wb-quick","aria-label":"\u5FEB\u6377\u5165\u53E3",children:[(0,e.jsxs)("button",{type:"button",className:"wb-qcard"+(S.length?" is-run":""),onClick:()=>p("running"),children:[(0,e.jsx)("span",{className:"wb-qicon is-accent",children:(0,e.jsx)(z,{name:"activity",size:17})}),(0,e.jsxs)("span",{className:"wb-qbody",children:[(0,e.jsx)("span",{className:"wb-qlabel",children:"\u8FD0\u884C\u4E2D"}),(0,e.jsx)("span",{className:"wb-qvalue",children:(0,e.jsx)("b",{className:"num",children:S.length})}),(0,e.jsx)("span",{className:"wb-qdesc",children:S.length?S.slice(0,2).map(s=>s.p.title).join(" \xB7 "):"\u6682\u65E0\u8FD0\u884C\u4E2D\u7684\u4F1A\u8BDD"})]}),(0,e.jsx)("span",{className:"wb-qgo",children:(0,e.jsx)(z,{name:"arrow-right",size:13})})]}),(0,e.jsxs)("button",{type:"button",className:"wb-qcard",onClick:()=>p("continue"),children:[(0,e.jsx)("span",{className:"wb-qicon is-blue",children:(0,e.jsx)(z,{name:"history",size:17})}),(0,e.jsxs)("span",{className:"wb-qbody",children:[(0,e.jsx)("span",{className:"wb-qlabel",children:"\u7EE7\u7EED\u5DE5\u4F5C"}),(0,e.jsxs)("span",{className:"wb-qvalue",children:[(0,e.jsx)("b",{className:"num",children:A.length}),(0,e.jsx)("span",{className:"delta",children:"\u6700\u8FD1 7 \u5929"})]}),(0,e.jsx)("span",{className:"wb-qdesc",children:A[0]?`\u6700\u8FD1\uFF1A${A[0].s.title??"(\u65E0\u6807\u9898)"}`:"\u6682\u65E0\u8FD1\u671F\u4F1A\u8BDD"})]}),(0,e.jsx)("span",{className:"wb-qgo",children:(0,e.jsx)(z,{name:"arrow-right",size:13})})]}),(0,e.jsxs)("button",{type:"button",className:"wb-qcard",onClick:()=>p("todos"),children:[(0,e.jsx)("span",{className:"wb-qicon is-amber",children:(0,e.jsx)(z,{name:"list-todo",size:17})}),(0,e.jsxs)("span",{className:"wb-qbody",children:[(0,e.jsx)("span",{className:"wb-qlabel",children:"\u5F85\u529E"}),(0,e.jsxs)("span",{className:"wb-qvalue",children:[(0,e.jsx)("b",{className:"num",children:E}),R>0&&(0,e.jsxs)("span",{className:"delta hot",children:["\u542B\u624B\u52A8 ",R]})]}),(0,e.jsx)("span",{className:"wb-qdesc",children:w.filter(s=>s.todoTotal>0).length?`\u5206\u5E03\u5728 ${w.filter(s=>s.todoTotal>0).length} \u4E2A\u9879\u76EE`:"\u6682\u65E0\u672A\u5B8C\u6210\u5F85\u529E"})]}),(0,e.jsx)("span",{className:"wb-qgo",children:(0,e.jsx)(z,{name:"arrow-right",size:13})})]}),(0,e.jsxs)("button",{type:"button",className:"wb-qcard",onClick:b,children:[(0,e.jsx)("span",{className:"wb-qicon is-danger",children:(0,e.jsx)(z,{name:"alert-triangle",size:17})}),(0,e.jsxs)("span",{className:"wb-qbody",children:[(0,e.jsx)("span",{className:"wb-qlabel",children:"\u8BCA\u65AD"}),(0,e.jsx)("span",{className:"wb-qvalue",children:(0,e.jsx)("b",{className:"num",children:K})}),(0,e.jsx)("span",{className:"wb-qdesc",children:K>0?`\u7F13\u5B58\u7F3A\u5931 ${t.diagnostics.cacheIssues.length} \xB7 \u65E0\u4E3B\u8F6C\u5F55 ${t.diagnostics.unclaimed.length}`:"\u6CA1\u6709\u53D1\u73B0\u5F02\u5E38"})]}),(0,e.jsx)("span",{className:"wb-qgo",children:(0,e.jsx)(z,{name:"arrow-right",size:13})})]})]}),(0,e.jsxs)("section",{className:"wb-recent","aria-label":"\u9879\u76EE\u603B\u89C8",children:[(0,e.jsxs)("div",{className:"wb-ovhead",children:[(0,e.jsx)("h2",{children:"\u9879\u76EE\u603B\u89C8"}),(0,e.jsxs)("div",{className:"tools",children:[(0,e.jsx)("div",{className:"wb-seg",role:"tablist","aria-label":"\u9879\u76EE\u72B6\u6001\u7B5B\u9009",children:[["active","\u8FDB\u884C\u4E2D",w.filter(s=>!s.p.archived).length],["archived","\u5DF2\u5F52\u6863",w.filter(s=>!!s.p.archived).length],["all","\u5168\u90E8",w.length]].map(([s,d,C])=>(0,e.jsxs)("button",{type:"button",role:"tab","aria-selected":f===s,onClick:()=>D(s),children:[d,(0,e.jsx)("span",{className:"cnt num",children:C})]},s))}),(0,e.jsxs)("div",{className:"wb-viewseg",role:"group","aria-label":"\u89C6\u56FE\u5207\u6362",children:[(0,e.jsx)("button",{type:"button","aria-pressed":ce==="grid","aria-label":"\u5361\u7247\u89C6\u56FE",onClick:()=>se("grid"),children:(0,e.jsx)(z,{name:"layout-grid",size:14})}),(0,e.jsx)("button",{type:"button","aria-pressed":ce==="list","aria-label":"\u5217\u8868\u89C6\u56FE",onClick:()=>se("list"),children:(0,e.jsx)(z,{name:"list",size:14})})]})]})]}),pe.length===0?(0,e.jsx)("div",{className:"wb-empty-state",children:"\u8BE5\u5206\u7EC4\u4E0B\u6CA1\u6709\u9879\u76EE"}):ce==="grid"?(0,e.jsx)("div",{className:"wb-pgrid",children:pe.map(s=>(0,e.jsxs)("button",{type:"button",className:"wb-pcard"+(s.liveness==="running"?" is-run":"")+(s.p.archived?" is-arch":""),onClick:()=>o(s.p.id),children:[(0,e.jsxs)("span",{className:"wb-ptop",children:[(0,e.jsx)("span",{className:"wb-dot "+N(s)}),(0,e.jsx)("span",{className:"wb-pname",children:s.p.title}),x(s),(0,e.jsxs)("span",{className:"wb-plast num",children:["\u6700\u8FD1\u6D3B\u52A8 \xB7 ",qe(s.p.lastActivityAt)]})]}),(0,e.jsx)("span",{className:"wb-ppath mono",children:s.p.path}),(0,e.jsxs)("span",{className:"wb-ptiles num",children:[(0,e.jsxs)("span",{className:"wb-ptile",children:[(0,e.jsx)("b",{children:s.activeCount}),(0,e.jsx)("span",{children:"\u8FD1\u671F\u6D3B\u8DC3"})]}),(0,e.jsxs)("span",{className:"wb-ptile",children:[(0,e.jsx)("b",{className:s.todoTotal?"hot":"",children:s.todoTotal}),(0,e.jsx)("span",{children:"\u5F85\u529E"})]}),(0,e.jsxs)("span",{className:"wb-ptile",children:[(0,e.jsx)("b",{children:s.archivedCount}),(0,e.jsx)("span",{children:"\u5F52\u6863"})]})]}),(0,e.jsx)("span",{className:"wb-pfoot",children:(0,e.jsx)("span",{className:"t",children:s.latest?.title??"\u2014"})})]},s.p.id))}):(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{className:"wb-lhead","aria-hidden":"true",children:[(0,e.jsx)("span",{children:"\u9879\u76EE"}),(0,e.jsx)("span",{className:"pth",children:"\u8DEF\u5F84"}),(0,e.jsx)("span",{className:"r",children:"\u6D3B\u8DC3"}),(0,e.jsx)("span",{className:"r",children:"\u5F85\u529E"}),(0,e.jsx)("span",{className:"r",children:"\u5F52\u6863"}),(0,e.jsx)("span",{className:"r",children:"\u6700\u8FD1\u6D3B\u52A8"}),(0,e.jsx)("span",{})]}),(0,e.jsx)("div",{children:pe.map(s=>(0,e.jsxs)("button",{type:"button",className:"wb-lrow"+(s.p.archived?" is-arch":""),onClick:()=>o(s.p.id),children:[(0,e.jsxs)("span",{className:"nm",children:[(0,e.jsx)("span",{className:"wb-mini sm",style:{background:s.color,color:Be(s.color)},children:s.tile}),(0,e.jsx)("span",{children:s.p.title}),x(s)]}),(0,e.jsx)("span",{className:"pth mono",children:s.p.path}),(0,e.jsx)("span",{className:"n num",children:s.activeCount}),(0,e.jsx)("span",{className:"n num"+(s.todoTotal?" hot":""),children:s.todoTotal}),(0,e.jsx)("span",{className:"n num",children:s.archivedCount}),(0,e.jsx)("span",{className:"tm num",children:ne(s.p.lastActivityAt)}),(0,e.jsx)("span",{})]},s.p.id))})]})]})]})})]})}async function Ut(t,n,o){let i=[],l=[],b=[],c=0;for(let v of t){try{await n(v)==="skip"?l.push(v):i.push(v)}catch(k){b.push({id:v,error:k?.message??String(k)})}c+=1,o?.(c,t.length)}return{requested:t.length,succeeded:i,skipped:l,failures:b,remaining:b.map(v=>v.id)}}function Sn(t){return Number.isFinite(t)?Math.min(36500,Math.max(1,Math.round(t))):30}function Ft(t,n){let o=n.now??Date.now(),i=Sn(n.days),l=n.liveIds?new Set(n.liveIds):null,b=n.pendingSessionIds?new Set(n.pendingSessionIds):null,c=o-i*24*36e5,v=[];for(let k of t.sessions)if(An(k,{now:o,cutoff:c,live:l,pending:b,currentSessionId:n.currentSessionId??null})){let w=k.lastActivityAt;v.push({sessionId:k.id,title:k.title,lastActivityAt:w,idleDays:Math.floor((o-w)/(24*36e5))})}return v.sort((k,w)=>w.idleDays-k.idleDays),v}function An(t,n){return t.archived||t.id===n.currentSessionId||n.live?.has(t.id)||n.pending?.has(t.id)||t.lastActivityAt===null?!1:t.lastActivityAt<=n.cutoff}var a=require("react/jsx-runtime"),lt={all:"\u5168\u90E8\u4F1A\u8BDD",todo:"\u6709\u5F85\u529E",untitled:"\u65E0\u6807\u9898",cacheOnly:"\u4EC5\u7F13\u5B58\u8BB0\u5F55",empty:"\u7A7A\u58F3\u4F1A\u8BDD"},Kt={activity:"\u6700\u8FD1\u6D3B\u52A8",created:"\u521B\u5EFA\u65F6\u95F4",turns:"\u5BF9\u8BDD\u8F6E\u6B21"};function Gt({state:t,project:n,liveIds:o,getUiWorkspace:i,getWorkspaces:l,onPreview:b,onOpenDiagnostics:c,onChanged:v,onBack:k}){let[w,S]=y("running"),[T,A]=y(!1),[E,R]=y([]),[K,u]=y(null),[p,f]=y(!1),[D,ce]=y(!1),[se,pe]=y(30),[ge,Z]=y([]),[ae,Q]=y([]),[ee,j]=y(()=>Se(n.id)),[be,le]=y(""),[G,ue]=y(""),[te,H]=y(null),[q,me]=y("all"),[V,X]=y("activity"),O=U(()=>Ee(n,Date.now(),o??null),[n,o]),de=U(()=>Ft(n,{days:se,liveIds:o??null}),[n,se,o]),x=Re(n),N=ee.filter(r=>!r.done).length,J=x+N,W=U(()=>Le(n),[n]),s=n.sessions.reduce((r,h)=>r+h.todos.filter(M=>M.status==="in_progress").length,0),d=Date.now(),C=new Date().setHours(0,0,0,0),_=n.sessions.length,fe=O.archived.length,Te=n.sessions.filter(r=>(r.createdAt??0)>=C).length,dt=n.sessions.filter(r=>(r.lastActivityAt??0)>=d-7*864e5).length,ct=ee.filter(r=>r.createdAt>=C).length,pt=O.running,en=new Set(n.sessions.map(r=>r.id)),tn=n.path.replace(/[\\/]+$/,"").toLowerCase(),Ue=t.diagnostics.cacheIssues.filter(r=>en.has(r.sessionId)),Fe=t.diagnostics.unclaimed.filter(r=>(r.cwd??"").replace(/[\\/]+$/,"").toLowerCase()===tn),bt=U(()=>{let h=O[w].filter(M=>q==="todo"?M.todos.some(I=>I.status!=="completed"):q==="untitled"?M.title===null:q==="cacheOnly"?M.source==="cacheOnly":q==="empty"?M.empty:!0).slice();return V==="created"?h.sort((M,I)=>(I.createdAt??0)-(M.createdAt??0)):V==="turns"?h.sort((M,I)=>(I.turns??-1)-(M.turns??-1)):h.sort((M,I)=>(I.lastActivityAt??0)-(M.lastActivityAt??0)),h},[O,w,q,V]),ut=O[w].length-bt.length,Ce=U(()=>{let r=new Set(o??[]);return n.sessions.filter(h=>h.empty&&!h.archived&&!r.has(h.id)).map(h=>h.id)},[n.sessions,o]),oe=[];if(pt.length>0&&oe.push({key:"running",text:`${pt.length} \u4E2A\u4F1A\u8BDD\u6B63\u5728\u6267\u884C`,at:d,tone:"ok"}),Ce.length>0&&oe.push({key:"shell",text:`${Ce.length} \u4E2A\u7A7A\u58F3\u4F1A\u8BDD\u53EF\u6E05\u7406`,at:null,tone:"warn"}),Ue.length>0){let r=new Set(Ue.map(M=>M.sessionId)),h=Math.max(0,...n.sessions.filter(M=>r.has(M.id)).map(M=>M.lastActivityAt??M.createdAt??0));oe.push({key:"untitled",text:`${Ue.length} \u4E2A\u4F1A\u8BDD\u7F3A\u5C11\u6807\u9898\u8BB0\u5F55`,at:h||null,tone:"warn"})}if(Fe.length>0){let r=Math.max(0,...Fe.map(h=>h.createdAt??0));oe.push({key:"unclaimed",text:`${Fe.length} \u4E2A\u8F6C\u5F55\u672A\u5F52\u5C5E\u5230\u672C\u5DE5\u4F5C\u533A`,at:r||null,tone:"warn"})}if(Te>0){let r=Math.max(0,...n.sessions.filter(h=>(h.createdAt??0)>=C).map(h=>h.createdAt??0));oe.push({key:"created",text:`\u4ECA\u65E5\u65B0\u5EFA ${Te} \u4E2A\u4F1A\u8BDD`,at:r||null,tone:"muted"})}if(ct>0&&oe.push({key:"manual",text:`\u4ECA\u65E5\u65B0\u589E ${ct} \u6761\u624B\u52A8\u5F85\u529E`,at:Math.max(...ee.filter(r=>r.createdAt>=C).map(r=>r.createdAt)),tone:"muted"}),fe>0){let r=Math.max(0,...O.archived.map(h=>h.lastActivityAt??0));oe.push({key:"archived",text:`\u5F52\u6863\u4F1A\u8BDD ${fe} \u4E2A`,at:r||null,tone:"muted"})}oe.sort((r,h)=>(h.at??0)-(r.at??0));let Ie=(r,h)=>{if(h.length===0||r==="delete"&&!confirm(`\u6C38\u4E45\u5220\u9664 ${h.length} \u4E2A\u4F1A\u8BDD\uFF1F\uFF08\u8F6C\u5F55\u6587\u4EF6\u88AB\u5220\u9664\uFF0C\u4E0D\u53EF\u6062\u590D\uFF09`))return;f(!0),u(null),(async()=>{if(r==="delete")return $e(h);let I=l?.();if(r==="archive"&&!I?.archiveSession)throw new Error("\u5F52\u6863\u670D\u52A1\u4E0D\u53EF\u7528");if(r==="unarchive"&&!I?.unarchiveSession)throw new Error("\u53D6\u6D88\u5F52\u6863\u670D\u52A1\u4E0D\u53EF\u7528");return Ut(h,async we=>(r==="archive"?await I.archiveSession(we,{stopActivity:!0}):await I.unarchiveSession(we),"ok"))})().then(I=>{f(!1),r==="archive"&&Q(I.succeeded);let ie=`${r==="archive"?"\u5F52\u6863":r==="unarchive"?"\u53D6\u6D88\u5F52\u6863":"\u5220\u9664"}\uFF1A\u6210\u529F ${I.succeeded.length} \xB7 \u8DF3\u8FC7 ${I.skipped.length} \xB7 \u5931\u8D25 ${I.failures.length}`;u(I.failures.length>0?`${ie}\uFF08${I.failures[0]?.error??"\u672A\u77E5\u9519\u8BEF"}\uFF09`:ie);let Ve=new Set([...I.succeeded,...I.skipped]);R(B=>B.filter(ye=>!Ve.has(ye))),Z(B=>B.filter(ye=>!Ve.has(ye))),v?.()},I=>{f(!1),u(`\u64CD\u4F5C\u5931\u8D25\uFF1A${String(I?.message??I)}`)})},nn=()=>{let r=ae;Q([]),Ie("unarchive",r)},sn=r=>R(h=>h.includes(r)?h.filter(M=>M!==r):[...h,r]),an=r=>Z(h=>h.includes(r)?h.filter(M=>M!==r):[...h,r]),on=()=>{be.trim()&&(j(jt(n.id,be)),le(""))},rn=()=>{let r=i?.();if(!n.workspaceId){u("\u8FD9\u4E2A\u9879\u76EE\u6CA1\u6709\u5BBF\u4E3B\u5DE5\u4F5C\u533A\uFF08\u591A\u4E3A\u76EE\u5F55\u6539\u540D/\u642C\u8FC1\u540E\u7684\u5386\u53F2\u8BB0\u5F55\uFF09\uFF0C\u65E0\u6CD5\u65B0\u5EFA\u4F1A\u8BDD\u3002");return}if(!r?.openWorkspace){u("\u5BBF\u4E3B\u672A\u63D0\u4F9B\u65B0\u5EFA\u4F1A\u8BDD\u63A5\u53E3\uFF08\u63D2\u4EF6\u8DEF\u7531\u5728\u5E94\u7528\u542F\u52A8\u65F6\u52A0\u8F7D\uFF09\uFF0C\u8BF7\u91CD\u542F\u684C\u9762\u5E94\u7528\u540E\u518D\u8BD5\u3002");return}r.openWorkspace(n.workspaceId,()=>{})},ze=t.projects.filter(r=>r.workspaceId!==null&&r.id!==n.id),Ke=r=>r.includes("sessionIds are required")||r.includes("workspaceId and sessionIds")?"\u5BBF\u4E3B\u63D2\u4EF6\u4ECD\u662F\u65E7\u7248\u672C\uFF08\u8DEF\u7531\u5728\u5E94\u7528\u542F\u52A8\u65F6\u52A0\u8F7D\uFF09\uFF0C\u8BF7\u91CD\u542F\u684C\u9762\u5E94\u7528\u540E\u518D\u8BD5":r,wt=r=>r.split(/[\\/]/).filter(Boolean).pop()??r,ln=r=>{let h=r.workspaceId;if(!h)return;let M=n.sessions.length,I=n.path;confirm(`\u628A\u300C${I}\u300D\u4E0B\u7684 ${M} \u4E2A\u4F1A\u8BDD\u5F52\u5230\u5DE5\u4F5C\u533A\u300C${r.title}\u300D\u4E0B\uFF1F

\u53EA\u5199\u63D2\u4EF6\u81EA\u5DF1\u7684\u5F52\u5C5E\u8868\uFF08~/.dsh/storages/dsh-overview-aliases.json\uFF09\uFF0C\u4E0D\u4FEE\u6539\u5BBF\u4E3B workspace.json\uFF0C\u4E5F\u4E0D\u52A8\u8F6C\u5F55\u6587\u4EF6\u4E0E\u5F52\u6863\u72B6\u6001\uFF1B\u5BBF\u4E3B\u7684\u4FA7\u680F\u4E0E CLI \u4ECD\u6309\u5B83\u4EEC\u81EA\u5DF1\u7684\u6210\u5458\u8868\uFF0C\u770B\u4E0D\u5230\u8FD9\u4E9B\u4F1A\u8BDD\u3002\u53EF\u968F\u65F6\u300C\u53D6\u6D88\u5E76\u5165\u300D\u3002`)&&(f(!0),u(null),Je(h,I).then(ie=>{f(!1),u(ie.refreshError?`\u5DF2\u5199\u5165\uFF0C\u4F46\u5237\u65B0\u5931\u8D25\uFF1A${ie.refreshError}`:`\u5DF2\u628A\u300C${wt(I)}\u300D\u5F52\u5230\u300C${r.title}\u300D\u4E0B\uFF08${M} \u4E2A\u4F1A\u8BDD\uFF09`),v?.()},ie=>{f(!1),u(`\u5E76\u5165\u5931\u8D25\uFF1A${Ke(String(ie?.message??ie))}`)}))},dn=r=>{confirm(`\u53D6\u6D88\u300C${wt(r)}\u300D\u7684\u5E76\u5165\uFF1F\u8FD9\u4E9B\u4F1A\u8BDD\u4F1A\u56DE\u5230\u5B64\u513F\u5217\u8868\u3002`)&&(f(!0),Je("",r,{forget:!0}).then(()=>{f(!1),u("\u5DF2\u53D6\u6D88\u5E76\u5165"),v?.()},h=>{f(!1),u(`\u53D6\u6D88\u5931\u8D25\uFF1A${Ke(String(h?.message??h))}`)}))},Ge=U(()=>n.staleCwds.length===0?[]:n.sessions.filter(r=>r.cwd!==null&&n.staleCwds.some(h=>h===r.cwd)).map(r=>r.id),[n]),ht=(r,h,M)=>{let I=new Set(O.running.map(B=>B.id)),we=h.filter(B=>!I.has(B)),ie=h.length-we.length;if(we.length===0){u("\u9009\u4E2D\u7684\u4F1A\u8BDD\u90FD\u5728\u8FD0\u884C\u4E2D\uFF0C\u5148\u7ED3\u675F\u4F1A\u8BDD\u518D\u8FC1\u79FB\u3002");return}confirm(`\u628A\u8FD9 ${we.length} \u4E2A\u4F1A\u8BDD\u771F\u6B63\u8FC1\u79FB\u5230\u300C${M}\u300D\uFF1F

\u4F1A\u6539\u5199\u6BCF\u4E2A\u8F6C\u5F55\u5934\u91CC\u7684 cwd \u5E76\u642C\u5230\u5BF9\u5E94\u76EE\u5F55\uFF08\u53EA\u91CD\u5199\u9996\u5E27\uFF0C\u5176\u4F59\u5E27\u9010\u5B57\u8282\u4FDD\u7559\uFF09\u3002\u539F\u4EF6\u5148\u5907\u4EFD\u5230 ~/.dsh/storages/dsh-overview-migration-backup/\uFF0C\u5931\u8D25\u7684\u90A3\u6761\u4E0D\u4F1A\u52A8\u3002\u91CD\u542F\u684C\u9762\u5E94\u7528\u540E\uFF0C\u5BBF\u4E3B\u4FA7\u680F\u91CC\u5B83\u4EEC\u5C31\u4F1A\u51FA\u73B0\u5728\u8BE5\u5DE5\u4F5C\u533A\u4E0B\u3002`)&&(f(!0),u(null),kt(r,we).then(B=>{f(!1);let ye=B.failures[0]?.error;u(`\u8FC1\u79FB\uFF1A\u6210\u529F ${B.succeeded.length} \xB7 \u5931\u8D25 ${B.failures.length}${ie>0?` \xB7 \u8DF3\u8FC7\u8FD0\u884C\u4E2D ${ie}`:""}${ye?`\uFF08${ye}\uFF09`:""}`+(B.refreshError?`\uFF1B\u5237\u65B0\u5931\u8D25\uFF1A${B.refreshError}`:"")),v?.()},B=>{f(!1),u(`\u8FC1\u79FB\u5931\u8D25\uFF1A${Ke(String(B?.message??B))}`)}))};return(0,a.jsxs)("section",{className:"wb-main",children:[(0,a.jsxs)("header",{className:"wb-dhead",children:[(0,a.jsx)("button",{type:"button",className:"wb-back-btn","aria-label":"\u8FD4\u56DE\u5DE5\u4F5C\u533A\u5217\u8868",title:"\u8FD4\u56DE\u5DE5\u4F5C\u533A\u5217\u8868",onClick:k,children:(0,a.jsx)(z,{name:"arrow-left",size:14})}),(0,a.jsxs)("div",{className:"wb-dhead-main",children:[(0,a.jsx)("h1",{children:n.title}),(0,a.jsx)("span",{className:"wb-proj-path mono",children:n.path})]}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn is-primary wb-new-session",disabled:p,title:n.workspaceId?"\u5728\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u5F00\u4E00\u4E2A\u65B0\u4F1A\u8BDD":"\u5B64\u513F\u9879\u76EE\u6CA1\u6709\u5BBF\u4E3B\u5DE5\u4F5C\u533A\uFF0C\u65E0\u6CD5\u65B0\u5EFA\u4F1A\u8BDD",onClick:rn,children:"\u65B0\u5EFA\u4F1A\u8BDD"})]}),!n.existsOnDisk&&(0,a.jsx)("div",{className:"wb-dead-banner",children:"\u5DE5\u4F5C\u533A\u76EE\u5F55\u5F53\u524D\u4E0D\u5B58\u5728\uFF08\u88AB\u79FB\u52A8\u6216\u5220\u9664\uFF09\uFF0C\u4EE5\u4E0B\u4E3A\u5386\u53F2\u6570\u636E\u3002"}),n.staleCwds.length>0&&(0,a.jsxs)("div",{className:"wb-stale-banner",children:["\u6709 ",n.staleCwds.length," \u4E2A\u4F1A\u8BDD\u8BB0\u5F55\u5728\u65E7\u8DEF\u5F84 ",(0,a.jsx)("span",{className:"mono",children:n.staleCwds[0]}),n.staleCwds.length>1?` \u7B49 ${n.staleCwds.length} \u5904`:"","\u3002\u9879\u76EE\u88AB\u6539\u540D\u6216\u79FB\u52A8\u8FC7\uFF0C\u4F1A\u8BDD\u5DF2\u6309\u5DE5\u4F5C\u533A\u6210\u5458\u8868\u6216\u63D2\u4EF6\u5F52\u5C5E\u8868\u5F52\u5230\u8FD9\u91CC\uFF0C\u4E0D\u5F71\u54CD\u7EDF\u8BA1\u4E0E\u7EED\u63A5\u3002",n.workspaceId!==null&&Ge.length>0?(0,a.jsxs)("button",{type:"button",className:"wb-link-btn",disabled:p,title:"\u6539\u5199\u8F6C\u5F55\u5934 cwd \u5E76\u642C\u76EE\u5F55\uFF0C\u8BA9\u5BBF\u4E3B\u4FA7\u680F\u4E5F\u5F52\u5230\u8FD9\u4E2A\u5DE5\u4F5C\u533A",onClick:()=>ht(n.workspaceId,Ge,n.title),children:["\u8FC1\u79FB\u5230\u672C\u9879\u76EE\uFF08",Ge.length,"\uFF09"]}):null,n.workspaceId!==null&&n.staleCwds[0]?(0,a.jsx)("button",{type:"button",className:"wb-link-btn",disabled:p,onClick:()=>dn(n.staleCwds[0]),children:"\u53D6\u6D88\u5E76\u5165"}):null]}),n.workspaceId===null&&ze.length>0&&(0,a.jsxs)("div",{className:"wb-adopt",children:[(0,a.jsxs)("span",{className:"txt",children:["\u8FD9\u4E2A\u9879\u76EE\u6CA1\u6709\u5BF9\u5E94\u7684\u5BBF\u4E3B\u5DE5\u4F5C\u533A\uFF08\u591A\u4E3A\u76EE\u5F55\u6539\u540D/\u642C\u8FC1\u540E\u7684\u5386\u53F2\u8BB0\u5F55\uFF09\u3002\u53EF\u4EE5\u628A\u5B83\u7684 ",n.sessions.length," \u4E2A\u4F1A\u8BDD\u5F52\u5230\u67D0\u4E2A\u73B0\u6709\u5DE5\u4F5C\u533A\u4E0B\uFF1A\u300C\u5E76\u5165\u300D\u53EA\u6539\u63D2\u4EF6\u5F52\u5C5E\u8868\uFF08\u5BBF\u4E3B\u4FA7\u680F\u4ECD\u663E\u793A\u672A\u5206\u7EC4\uFF09\uFF0C\u300C\u8FC1\u79FB\u8FC7\u6765\u300D\u4F1A\u6539\u5199\u8F6C\u5F55\u5934 cwd\uFF08\u5BBF\u4E3B\u4E5F\u8BA4\uFF0C\u4F1A\u5148\u5907\u4EFD\uFF09\uFF1A"]}),(0,a.jsxs)("select",{"aria-label":"\u9009\u62E9\u76EE\u6807\u5DE5\u4F5C\u533A",value:G,onChange:r=>ue(r.target.value),children:[(0,a.jsx)("option",{value:"",children:"\u9009\u62E9\u5DE5\u4F5C\u533A\u2026"}),ze.map(r=>(0,a.jsx)("option",{value:r.workspaceId??"",children:r.title},r.workspaceId))]}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn is-primary",disabled:p||!G,onClick:()=>{let r=ze.find(h=>h.workspaceId===G);r&&ln(r)},children:"\u5E76\u5165"}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn",disabled:p||!G,title:"\u6539\u5199\u8F6C\u5F55\u5934 cwd \u5E76\u642C\u76EE\u5F55\uFF1A\u5BBF\u4E3B\u4FA7\u680F\u4E5F\u8BA4\uFF08\u4F1A\u5148\u5907\u4EFD\uFF09",onClick:()=>{let r=ze.find(h=>h.workspaceId===G);r?.workspaceId&&ht(r.workspaceId,n.sessions.map(h=>h.id),r.title)},children:"\u8FC1\u79FB\u8FC7\u6765"})]}),(0,a.jsxs)("div",{className:"wb-kpi num",title:"\u7EDF\u8BA1\u8303\u56F4\uFF1A\u672C\u5DE5\u4F5C\u533A\uFF08\u5F53\u524D\u9879\u76EE\uFF09",children:[(0,a.jsxs)("div",{className:`kv${_===0?" is-zero":""}`,children:[(0,a.jsx)("span",{className:"k",children:"\u4F1A\u8BDD"}),(0,a.jsxs)("span",{className:"vv",children:[(0,a.jsx)("span",{className:"v",children:_}),Te>0&&(0,a.jsxs)("span",{className:"d",children:["+",Te," \u4ECA\u65E5"]})]})]}),(0,a.jsxs)("div",{className:`kv${J===0?" is-zero":""}`,children:[(0,a.jsx)("span",{className:"k",children:"\u5F85\u529E"}),(0,a.jsxs)("span",{className:"vv",children:[(0,a.jsx)("span",{className:"v",children:J}),s>0&&(0,a.jsxs)("span",{className:"d",children:[s," \u8FDB\u884C\u4E2D"]})]})]}),(0,a.jsxs)("div",{className:`kv${fe===0?" is-zero":""}`,children:[(0,a.jsx)("span",{className:"k",children:"\u5F52\u6863"}),(0,a.jsx)("span",{className:"vv",children:(0,a.jsx)("span",{className:"v",children:fe})})]}),(0,a.jsxs)("div",{className:`kv${dt===0?" is-zero":""}`,children:[(0,a.jsx)("span",{className:"k",children:"\u8FD1 7 \u65E5\u6D3B\u8DC3"}),(0,a.jsx)("span",{className:"vv",children:(0,a.jsx)("span",{className:"v",children:dt})})]})]}),(0,a.jsxs)("div",{className:"wb-cols",children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{className:"wb-listbar",children:[(0,a.jsxs)("div",{className:"wb-tabs",role:"tablist","aria-label":"\u672C\u9879\u76EE\u7684\u4F1A\u8BDD\u5206\u7EC4",children:[(0,a.jsxs)("button",{type:"button",className:"wb-tab",role:"tab","aria-selected":w==="running",title:"\u672C\u9879\u76EE\u8FDB\u884C\u4E2D\u7684\u4F1A\u8BDD\uFF08\u9876\u680F\u300C\u8FD0\u884C\u4E2D\u300D\u7EDF\u8BA1\u7684\u662F\u5168\u90E8\u5DE5\u4F5C\u533A\uFF09",onClick:()=>S("running"),children:["\u8FDB\u884C\u4E2D",(0,a.jsx)("span",{className:"cnt num",children:O.running.length})]}),(0,a.jsxs)("button",{type:"button",className:"wb-tab",role:"tab","aria-selected":w==="history",title:"\u672C\u9879\u76EE\u7684\u5386\u53F2\u4F1A\u8BDD",onClick:()=>S("history"),children:["\u5386\u53F2",(0,a.jsx)("span",{className:"cnt num",children:O.history.length})]}),(0,a.jsxs)("button",{type:"button",className:"wb-tab",role:"tab","aria-selected":w==="archived",title:"\u672C\u9879\u76EE\u5DF2\u5F52\u6863\u7684\u4F1A\u8BDD",onClick:()=>S("archived"),children:["\u5F52\u6863",(0,a.jsx)("span",{className:"cnt num",children:O.archived.length})]})]}),(0,a.jsxs)("div",{className:"wb-listctl",children:[(0,a.jsxs)("button",{type:"button",className:`wb-ctl${q!=="all"?" is-on":""}`,"aria-haspopup":"true","aria-expanded":te==="filter",onClick:()=>H(te==="filter"?null:"filter"),children:["\u7B5B\u9009",q!=="all"?(0,a.jsx)("span",{className:"cnt",children:"\xB71"}):null]}),(0,a.jsxs)("button",{type:"button",className:`wb-ctl${V!=="activity"?" is-on":""}`,"aria-haspopup":"true","aria-expanded":te==="sort",onClick:()=>H(te==="sort"?null:"sort"),children:["\u6392\u5E8F",(0,a.jsx)("span",{className:"caret",children:"\u25BE"})]}),te!==null&&(0,a.jsx)("div",{className:"wb-pop-scrim",onClick:()=>H(null)}),te==="filter"&&(0,a.jsxs)("div",{className:"wb-pop",role:"menu","aria-label":"\u7B5B\u9009\u4E0E\u6574\u7406",children:[(0,a.jsx)("div",{className:"pop-hd",children:"\u7B5B\u9009"}),Object.keys(lt).map(r=>(0,a.jsxs)("button",{type:"button",role:"menuitemradio","aria-checked":q===r,className:"pop-row",onClick:()=>{me(r),H(null)},children:[(0,a.jsx)("span",{children:lt[r]}),q===r&&(0,a.jsx)("span",{className:"tick",children:"\u2713"})]},r)),(0,a.jsx)("div",{className:"pop-sep"}),(0,a.jsx)("button",{type:"button",className:"pop-row",onClick:()=>{A(!T),R([]),H(null)},children:T?"\u5B8C\u6210\u9009\u62E9":"\u6279\u91CF\u9009\u62E9"}),(0,a.jsx)("button",{type:"button",className:"pop-row",onClick:()=>{ce(!D),Z([]),H(null)},children:"\u6574\u7406\u95F2\u7F6E\u2026"}),Ce.length>0&&(0,a.jsxs)("button",{type:"button",className:"pop-row",disabled:p,title:"\u5BBF\u4E3B\u65B0\u5EFA\u4F1A\u8BDD\u540E\u5207\u8D70\u7559\u4E0B\u7684\u7A7A\u58F3\uFF08\u8F6C\u5F55\u91CC\u6CA1\u6709\u4EFB\u4F55\u6D88\u606F\uFF09\uFF0C\u5BBF\u4E3B\u5DF2\u4E0D\u518D\u5217\u51FA\uFF0C\u5220\u6389\u4E0D\u5F71\u54CD\u4EFB\u4F55\u5BF9\u8BDD",onClick:()=>{H(null),Ie("delete",Ce)},children:["\u6E05\u7406\u7A7A\u58F3\u4F1A\u8BDD\uFF08",Ce.length,"\uFF09"]}),ae.length>0&&(0,a.jsxs)("button",{type:"button",className:"pop-row",disabled:p,onClick:()=>{H(null),nn()},children:["\u64A4\u9500\u5F52\u6863\uFF08",ae.length,"\uFF09"]})]}),te==="sort"&&(0,a.jsxs)("div",{className:"wb-pop",role:"menu","aria-label":"\u6392\u5E8F",children:[(0,a.jsx)("div",{className:"pop-hd",children:"\u6392\u5E8F"}),Object.keys(Kt).map(r=>(0,a.jsxs)("button",{type:"button",role:"menuitemradio","aria-checked":V===r,className:"pop-row",onClick:()=>{X(r),H(null)},children:[(0,a.jsx)("span",{children:Kt[r]}),V===r&&(0,a.jsx)("span",{className:"tick",children:"\u2713"})]},r))]})]})]}),K&&(0,a.jsx)("div",{className:"wb-listnote",children:K}),q!=="all"&&ut>0&&(0,a.jsxs)("div",{className:"wb-listnote num",children:["\u5DF2\u6309\u300C",lt[q],"\u300D\u8FC7\u6EE4\u6389 ",ut," \u4E2A\u4F1A\u8BDD"]}),D&&(0,a.jsxs)("div",{className:"wb-idle-panel",children:[(0,a.jsxs)("div",{className:"hd",children:["\u8D85\u8FC7",(0,a.jsxs)("select",{"aria-label":"\u95F2\u7F6E\u5929\u6570\u9608\u503C",value:se,onChange:r=>{pe(Number(r.target.value)),Z([])},children:[(0,a.jsx)("option",{value:7,children:"7"}),(0,a.jsx)("option",{value:30,children:"30"}),(0,a.jsx)("option",{value:90,children:"90"})]}),"\u5929\u6CA1\u6709\u6D3B\u52A8\u7684\u672A\u5F52\u6863\u4F1A\u8BDD\uFF08\u8FD0\u884C\u4E2D\u3001\u7B49\u5F85\u4EA4\u4E92\u3001\u5F53\u524D\u4F1A\u8BDD\u81EA\u52A8\u6392\u9664\uFF09"]}),de.length===0?(0,a.jsx)("div",{className:"wb-side-empty",children:"\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4F1A\u8BDD\uFF0C\u8BF4\u660E\u8FD9\u4E2A\u9879\u76EE\u8FD8\u633A\u6D3B\u8DC3\u3002"}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("ul",{className:"wb-pick-list",children:de.map(r=>(0,a.jsxs)("li",{children:[(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"checkbox",checked:ge.includes(r.sessionId),onChange:()=>an(r.sessionId)}),(0,a.jsx)("span",{className:"t",children:r.title??"(\u65E0\u6807\u9898)"})]}),(0,a.jsxs)("span",{className:"m num",children:[r.idleDays," \u5929\u672A\u52A8"]})]},r.sessionId))}),(0,a.jsxs)("div",{className:"wb-idle-actions",children:[(0,a.jsxs)("button",{type:"button",className:"wb-ghost-btn",onClick:()=>Z(de.map(r=>r.sessionId)),children:["\u5168\u9009\uFF08",de.length,"\uFF09"]}),(0,a.jsxs)("button",{type:"button",className:"wb-ghost-btn is-primary",disabled:p||ge.length===0,onClick:()=>Ie("archive",ge),children:["\u5F52\u6863\u9009\u4E2D\uFF08",ge.length,"\uFF09"]})]})]})]}),T&&(0,a.jsxs)("div",{className:"wb-batchbar",children:[(0,a.jsxs)("span",{className:"n num",children:["\u5DF2\u9009 ",E.length]}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn",disabled:p||E.length===0,onClick:()=>Ie(w==="archived"?"unarchive":"archive",E),children:w==="archived"?"\u53D6\u6D88\u5F52\u6863":"\u5F52\u6863"}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn wb-danger",disabled:p||E.length===0,onClick:()=>Ie("delete",E),children:"\u6C38\u4E45\u5220\u9664"}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn",onClick:()=>R([]),children:"\u6E05\u7A7A"}),(0,a.jsx)("button",{type:"button",className:"wb-ghost-btn",onClick:()=>{A(!1),R([])},children:"\u5B8C\u6210"})]}),(0,a.jsx)(In,{list:bt,tab:w,project:n,selecting:T,selected:E,onToggle:sn,onPreview:b,getUiWorkspace:i,getWorkspaces:l,onChanged:v})]}),(0,a.jsxs)("aside",{children:[(0,a.jsxs)("div",{className:"wb-side-card",children:[(0,a.jsxs)("h3",{children:["\u5F85\u529E",(0,a.jsx)("span",{className:"cnt num",children:N+W.length})]}),(0,a.jsxs)("form",{className:"wb-todo-add",onSubmit:r=>{r.preventDefault(),on()},children:[(0,a.jsx)("input",{value:be,onChange:r=>le(r.target.value),placeholder:"\u6DFB\u52A0\u4E00\u6761\u5F85\u529E\u2026","aria-label":"\u6DFB\u52A0\u4EBA\u5DE5\u5F85\u529E",maxLength:200}),(0,a.jsx)("button",{type:"submit",className:"wb-ghost-btn is-primary",disabled:!be.trim(),children:"\u6DFB\u52A0"})]}),N+W.length===0?(0,a.jsx)("div",{className:"wb-side-empty",children:"\u6682\u65E0\u672A\u5B8C\u6210\u5F85\u529E\u3002\u4F1A\u8BDD\u5185\u7684 todo \u8BB0\u5F55\u4F1A\u805A\u5408\u5230\u8FD9\u91CC\uFF0C\u4E5F\u53EF\u4EE5\u5728\u4E0A\u9762\u624B\u52A8\u8BB0\u4E00\u6761\u3002"}):(0,a.jsxs)("div",{className:"wb-feed wb-todo-feed",children:[ee.slice().sort((r,h)=>Number(r.done)-Number(h.done)||h.createdAt-r.createdAt).map(r=>(0,a.jsxs)("div",{className:`f f-manual${r.done?" is-done":""}`,children:[(0,a.jsx)("input",{type:"checkbox",checked:r.done,"aria-label":"\u6807\u8BB0\u5F85\u529E\u5B8C\u6210",onChange:()=>j(je(n.id,r.id))}),(0,a.jsx)("span",{className:"f-txt",children:r.text}),(0,a.jsx)("span",{className:"f-tag",children:"\u624B\u52A8"}),(0,a.jsx)("button",{type:"button",className:"f-del","aria-label":"\u5220\u9664\u5F85\u529E",title:"\u5220\u9664\u8FD9\u6761\u5F85\u529E",onClick:()=>j(He(n.id,r.id)),children:"\xD7"})]},r.id)),W.map((r,h)=>(0,a.jsxs)("div",{className:`f${r.status==="in_progress"?" is-run":""}`,children:[(0,a.jsx)("span",{className:"f-txt",children:r.content}),(0,a.jsx)("span",{className:"f-w",children:r.sessionTitle??"\u672A\u547D\u540D\u4F1A\u8BDD"})]},`${r.sessionId}-${h}`))]})]}),(0,a.jsxs)("div",{className:"wb-side-card",children:[(0,a.jsxs)("h3",{children:["\u8BCA\u65AD\u4E0E\u53D8\u66F4",(0,a.jsx)("span",{className:"cnt num",children:oe.length})]}),oe.length===0?(0,a.jsxs)("div",{className:"wb-side-empty",children:["\u6CA1\u6709\u5F02\u5E38\uFF0C\u6700\u8FD1\u4E5F\u6CA1\u6709\u53D8\u5316\u3002\u4ECA\u65E5\u6709\u6D3B\u52A8 ",n.sessions.filter(r=>(r.lastActivityAt??0)>=C).length," \u4E2A\u4F1A\u8BDD\u3002"]}):(0,a.jsx)("div",{className:"wb-timeline",children:oe.map(r=>(0,a.jsxs)("div",{className:`wb-tl is-${r.tone}`,children:[(0,a.jsx)("span",{className:"tl-dot"}),(0,a.jsx)("span",{className:"tl-txt",children:r.text}),(0,a.jsx)("span",{className:"tl-when num",children:r.at?ne(r.at):""})]},r.key))}),(0,a.jsxs)("div",{className:"wb-side-foot",children:[(0,a.jsx)("span",{children:"\u4F1A\u8BDD\u660E\u7EC6\u89C1\u5DE6\u4FA7\u5217\u8868"}),c&&(0,a.jsx)("button",{type:"button",className:"wb-link-btn",onClick:c,children:"\u6253\u5F00\u6570\u636E\u8BCA\u65AD"})]})]})]})]})]})}function Cn(t,n){if(n==="running")return"\u6B63\u5728\u6267\u884C";let o=t.todos.filter(i=>i.status!=="completed");return o.length>0?`\u5F85\u529E \xB7 ${o[0].content}${o.length>1?`\uFF08\u5171 ${o.length} \u6761\uFF09`:""}`:t.source==="cacheOnly"?"\u53EA\u6709\u7F13\u5B58\u8BB0\u5F55\uFF0C\u4F1A\u8BDD\u6587\u4EF6\u5DF2\u4E0D\u5728\u78C1\u76D8":t.origin==="subagent"?"\u5B50\u4EE3\u7406\u4F1A\u8BDD\uFF08\u5BBF\u4E3B\u4FA7\u680F\u4E0D\u663E\u793A\uFF09":n==="archived"?"\u5DF2\u5F52\u6863":null}function In({list:t,tab:n,project:o,selecting:i,selected:l,onToggle:b,onPreview:c,getUiWorkspace:v,getWorkspaces:k,onChanged:w}){let[S,T]=y(null),[A,E]=y(!1);if(t.length===0)return(0,a.jsx)("div",{className:"wb-side-empty is-pad",children:n==="running"?"\u5F53\u524D\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u4F1A\u8BDD":n==="history"?"\u6682\u65E0\u5386\u53F2\u4F1A\u8BDD":"\u6682\u65E0\u5F52\u6863\u4F1A\u8BDD"});let R=u=>{let p=v?.();if(p?.openSession){p.openSession(u.id);return}let f=_t(u);if(p?.openWorkspace&&o.workspaceId){p.openWorkspace(o.workspaceId,D=>Oe(D,f));return}try{navigator.clipboard.writeText(`${f}
\u7EED\u63A5\u547D\u4EE4\uFF1Adsh --resume ${u.id}`),alert("\u5DF2\u590D\u5236\u7EED\u63A5\u4E0A\u4E0B\u6587\u5230\u526A\u8D34\u677F\uFF08\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u76F4\u63A5\u8DF3\u8F6C\uFF09")}catch{alert(`\u7EED\u63A5\uFF1Adsh --resume ${u.id}

${f}`)}},K=(u,p)=>{(async()=>{if(u==="archive"){let D=k?.();if(!D?.archiveSession)throw new Error("\u5F52\u6863\u670D\u52A1\u4E0D\u53EF\u7528");await D.archiveSession(p.id,{stopActivity:!0});return}if(u==="unarchive"){let D=k?.();if(!D?.unarchiveSession)throw new Error("\u5F52\u6863\u670D\u52A1\u4E0D\u53EF\u7528");await D.unarchiveSession(p.id);return}await ft(p.id)})().then(()=>w?.(),D=>alert("\u64CD\u4F5C\u5931\u8D25\uFF1A"+String(D.message??D)))};return(0,a.jsx)("div",{children:t.map(u=>{let p=Cn(u,n);return(0,a.jsxs)("div",{className:`wb-srow${l.includes(u.id)?" is-picked":""}`,role:"button",tabIndex:0,onClick:()=>R(u),onKeyDown:f=>{f.target.closest?.(".wb-sact")||(f.key==="Enter"||f.key===" ")&&(f.preventDefault(),R(u))},children:[i&&(0,a.jsx)("input",{type:"checkbox",className:"wb-srow-check",checked:l.includes(u.id),"aria-label":`\u9009\u62E9\u4F1A\u8BDD ${u.title??u.id}`,onChange:f=>{f.stopPropagation(),b(u.id)},onClick:f=>f.stopPropagation()}),(0,a.jsx)("span",{className:`wb-dot ${n==="archived"?"wb-dot-off":n==="running"?"wb-dot-run":"wb-dot-idle"}`}),(0,a.jsxs)("span",{className:"wb-srow-main",children:[(0,a.jsxs)("span",{className:"wb-srow-t",children:[(0,a.jsx)("span",{className:"t",children:u.title??"(\u65E0\u6807\u9898)"}),u.derived&&(0,a.jsx)("span",{className:"wb-tag is-sub",title:"\u5B50\u4F1A\u8BDD\uFF1Acwd \u4E0E\u672C\u9879\u76EE\u4E0D\u540C\uFF0C\u9760\u6BCD\u4F1A\u8BDD\u5F52\u5230\u8FD9\u91CC",children:"\u5B50\u4F1A\u8BDD"}),u.empty&&(0,a.jsx)("span",{className:"wb-tag is-empty",title:"\u5BBF\u4E3B\u65B0\u5EFA\u4F1A\u8BDD\u540E\u5207\u8D70\u7559\u4E0B\u7684\u7A7A\u58F3\uFF1A\u8F6C\u5F55\u91CC\u6CA1\u6709\u4EFB\u4F55\u6D88\u606F\uFF0C\u5BBF\u4E3B\u4FA7\u5DF2\u4E0D\u518D\u5217\u51FA",children:"\u7A7A\u58F3"})]}),p&&(0,a.jsx)("span",{className:"sub",children:p})]}),(0,a.jsxs)("span",{className:"m num",children:[u.turns!==null?`${u.turns} \u8F6E \xB7 `:"",ne(u.lastActivityAt)]}),(0,a.jsxs)("span",{className:"wb-sact"+(S===u.id?" is-open":""),children:[S===u.id&&(0,a.jsx)("span",{className:"wb-sact-scrim",onClick:f=>{f.stopPropagation(),T(null)}}),(0,a.jsx)("button",{type:"button",className:"wb-sact-btn","aria-haspopup":"menu","aria-expanded":S===u.id,"aria-label":"\u4F1A\u8BDD\u64CD\u4F5C",title:"\u4F1A\u8BDD\u64CD\u4F5C",onClick:f=>{if(f.stopPropagation(),S===u.id){T(null);return}let D=f.currentTarget.getBoundingClientRect();E(D.bottom>window.innerHeight-200),T(u.id)},children:(0,a.jsx)(z,{name:"more-horizontal",size:15})}),S===u.id&&(0,a.jsxs)("span",{className:"wb-sact-menu"+(A?" is-up":""),role:"menu",onClick:f=>f.stopPropagation(),children:[(0,a.jsxs)("button",{type:"button",role:"menuitem",onClick:()=>{T(null),R(u)},children:[(0,a.jsx)(z,{name:"corner-up-right",size:14}),"\u7EED\u63A5"]}),c&&(0,a.jsxs)("button",{type:"button",role:"menuitem",onClick:()=>{T(null),c(u.id,u.title)},children:[(0,a.jsx)(z,{name:"eye",size:14}),"\u53EA\u8BFB\u9884\u89C8"]}),n==="archived"?(0,a.jsxs)("button",{type:"button",role:"menuitem",onClick:()=>{T(null),K("unarchive",u)},children:[(0,a.jsx)(z,{name:"unarchive",size:14}),"\u53D6\u6D88\u5F52\u6863"]}):(0,a.jsxs)("button",{type:"button",role:"menuitem",onClick:()=>{T(null),K("archive",u)},children:[(0,a.jsx)(z,{name:"archive",size:14}),"\u5F52\u6863"]}),(0,a.jsxs)("button",{type:"button",role:"menuitem",className:"wb-danger",onClick:()=>{T(null),confirm("\u6C38\u4E45\u5220\u9664\u8BE5\u4F1A\u8BDD\uFF1F\uFF08\u4F1A\u8BDD\u6587\u4EF6\u5C06\u88AB\u5220\u9664\uFF0C\u4E0D\u53EF\u6062\u590D\uFF09")&&K("delete",u)},children:[(0,a.jsx)(z,{name:"trash",size:14}),"\u6C38\u4E45\u5220\u9664"]})]})]})]},u.id)})})}var $=require("react/jsx-runtime");function Vt({sessionId:t,sessionTitle:n,query:o,onClose:i}){let[l,b]=y(null),[c,v]=y(null);return L(()=>{let k=new AbortController;return b(null),v(null),xt(t,o,k.signal).then(w=>b(w.messages),w=>{k.signal.aborted||v(String(w?.message??w))}),()=>k.abort()},[t,o]),L(()=>{let k=w=>{w.key==="Escape"&&i()};return document.addEventListener("keydown",k),()=>document.removeEventListener("keydown",k)},[i]),(0,$.jsx)("div",{className:"wb-overlay",role:"dialog","aria-modal":"true","aria-label":"\u4F1A\u8BDD\u53EA\u8BFB\u9884\u89C8",onClick:i,children:(0,$.jsxs)("div",{className:"wb-drawer",onClick:k=>k.stopPropagation(),children:[(0,$.jsxs)("header",{className:"wb-drawer-head",children:[(0,$.jsxs)("div",{children:[(0,$.jsx)("div",{className:"wb-drawer-title",children:n??"(\u65E0\u6807\u9898\u4F1A\u8BDD)"}),(0,$.jsxs)("div",{className:"wb-drawer-sub mono",children:[o?`\u542B\u300C${o}\u300D\u7684\u4E0A\u4E0B\u6587`:"\u6700\u8FD1\u5BF9\u8BDD"," \xB7 \u53EA\u8BFB\uFF0C\u4E0D\u6FC0\u6D3B\u4F1A\u8BDD"]})]}),(0,$.jsx)("button",{type:"button",className:"wb-ghost-btn",onClick:i,"aria-label":"\u5173\u95ED\u9884\u89C8",children:"\u5173\u95ED"})]}),(0,$.jsxs)("div",{className:"wb-drawer-body",children:[c&&(0,$.jsxs)("div",{className:"wb-side-empty",children:["\u9884\u89C8\u5931\u8D25\uFF1A",c]}),!c&&l===null&&(0,$.jsx)("div",{className:"wb-side-empty",children:"\u8BFB\u53D6\u8F6C\u5F55\u2026"}),!c&&l?.length===0&&(0,$.jsx)("div",{className:"wb-side-empty",children:"\u8BE5\u4F1A\u8BDD\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u5BF9\u8BDD\u6B63\u6587\u3002"}),l?.map(k=>(0,$.jsxs)("div",{className:`wb-msg wb-msg-${k.role}${k.hit?" is-hit":""}`,children:[(0,$.jsxs)("div",{className:"wb-msg-head",children:[(0,$.jsx)("span",{className:"who",children:k.role==="user"?"\u7528\u6237":"\u52A9\u624B"}),(0,$.jsx)("span",{className:"when num",children:ne(k.time)})]}),(0,$.jsx)("div",{className:"wb-msg-body",children:o?We(k.text,o).map((w,S)=>w.hit?(0,$.jsx)("mark",{children:w.text},S):(0,$.jsx)("span",{children:w.text},S)):k.text})]},k.seq))]})]})})}var g=require("react/jsx-runtime");function Xt({state:t,onOpenSession:n,getWorkspaces:o,onChanged:i,onClose:l}){let[b,c]=y(!1),[v,k]=y(null),{cacheIssues:w,unclaimed:S,staleArchiveRecords:T}=t.diagnostics,A=S.filter(p=>!p.pathRegistered),E=S.filter(p=>p.pathRegistered),R=A.reduce((p,f)=>p+(f.sizeBytes??0),0),K=p=>{p.length!==0&&confirm(`\u6C38\u4E45\u5220\u9664 ${p.length} \u4E2A\u672A\u5F52\u5C5E\u4F1A\u8BDD\u7684\u8F6C\u5F55\u6587\u4EF6\uFF1F\uFF08\u4E0D\u53EF\u6062\u590D\uFF09`)&&(c(!0),k(null),$e(p).then(f=>{c(!1);let D=[`\u6210\u529F ${f.succeeded.length}`,`\u8DF3\u8FC7 ${f.skipped.length}`,`\u5931\u8D25 ${f.failures.length}`];k(`\u6279\u91CF\u5220\u9664\uFF1A${D.join(" \xB7 ")}${f.remaining.length>0?`\uFF08\u53EF\u91CD\u8BD5 ${f.remaining.length} \u9879\uFF09`:""}`),i?.()},f=>{c(!1),k(`\u5220\u9664\u5931\u8D25\uFF1A${String(f?.message??f)}`)}))},u=p=>{let f=o?.();if(!f?.archiveSession){k("\u5F52\u6863\u670D\u52A1\u4E0D\u53EF\u7528\uFF08\u5F53\u524D\u73AF\u5883\u6CA1\u6709\u5BBF\u4E3B workspaces \u670D\u52A1\uFF09");return}c(!0),f.archiveSession(p,{stopActivity:!0}).then(()=>{c(!1),k("\u5DF2\u5F52\u6863"),i?.()},D=>{c(!1),k(`\u5F52\u6863\u5931\u8D25\uFF1A${String(D?.message??D)}`)})};return(0,g.jsx)("div",{className:"wb-overlay",role:"dialog","aria-modal":"true","aria-label":"\u6570\u636E\u8BCA\u65AD",onClick:l,children:(0,g.jsxs)("div",{className:"wb-drawer",onClick:p=>p.stopPropagation(),children:[(0,g.jsxs)("header",{className:"wb-drawer-head",children:[(0,g.jsxs)("div",{children:[(0,g.jsx)("div",{className:"wb-drawer-title",children:"\u6570\u636E\u8BCA\u65AD"}),(0,g.jsxs)("div",{className:"wb-drawer-sub",children:["\u7F13\u5B58\u7531\u5BBF\u4E3B\u7EF4\u62A4 \xB7 \u5220\u9664\u4E0D\u53EF\u6062\u590D \xB7 \u6570\u636E ",ne(t.generatedAt),"\u66F4\u65B0"]})]}),(0,g.jsx)("button",{type:"button",className:"wb-ghost-btn",onClick:l,"aria-label":"\u5173\u95ED\u8BCA\u65AD",children:"\u5173\u95ED"})]}),(0,g.jsxs)("div",{className:"wb-drawer-body",children:[v&&(0,g.jsx)("div",{className:"wb-note",children:v}),(0,g.jsxs)("section",{className:"wb-diag",children:[(0,g.jsxs)("h4",{children:["\u6295\u5F71\u7F13\u5B58\u5F02\u5E38",(0,g.jsx)("span",{className:"cnt num",children:w.length})]}),w.length===0?(0,g.jsx)("div",{className:"wb-side-empty",children:"\u6CA1\u6709\u53D1\u73B0\u7F3A\u5931\u6216\u65E0\u6807\u9898\u7684\u6295\u5F71\u8BB0\u5F55\u3002"}):(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)("p",{className:"wb-diag-hint",children:"\u8FD9\u4E9B\u4F1A\u8BDD\u7684\u6295\u5F71\u7F13\u5B58\u7F3A\u5931\u6216\u4E0D\u542B\u6807\u9898\u3002\u7F13\u5B58\u7531\u5BBF\u4E3B\u5199\u5165\uFF0C\u63D2\u4EF6\u53EA\u8BFB\u2014\u2014\u70B9\u300C\u6253\u5F00\u4F1A\u8BDD\u300D\u8BA9\u5BBF\u4E3B\u6309\u81EA\u5DF1\u7684\u8DEF\u5F84\u91CD\u5EFA\u3002"}),(0,g.jsx)("ul",{className:"wb-diag-list",children:w.slice(0,30).map(p=>(0,g.jsxs)("li",{children:[(0,g.jsx)("span",{className:`wb-tag ${p.kind==="no-record"?"is-warn":""}`,children:p.kind==="no-record"?"\u65E0\u8BB0\u5F55":"\u65E0\u6807\u9898"}),(0,g.jsx)("span",{className:"t",children:p.title??"(\u65E0\u6807\u9898)"}),(0,g.jsx)("span",{className:"p mono",children:p.cwd??"\u2014"}),(0,g.jsx)("button",{type:"button",className:"wb-ghost-btn",disabled:b||!n,onClick:()=>n?.(p.sessionId),children:"\u6253\u5F00\u4F1A\u8BDD"})]},p.sessionId))})]})]}),(0,g.jsxs)("section",{className:"wb-diag",children:[(0,g.jsxs)("h4",{children:["\u65E0\u4E3B\u8F6C\u5F55",(0,g.jsx)("span",{className:"cnt num",children:A.length})]}),A.length===0?(0,g.jsx)("div",{className:"wb-side-empty",children:"\u6CA1\u6709\u627E\u4E0D\u5230\u5F52\u5C5E\u7684\u8F6C\u5F55\u6587\u4EF6\u3002"}):(0,g.jsxs)(g.Fragment,{children:[(0,g.jsxs)("p",{className:"wb-diag-hint",children:["\u8F6C\u5F55\u5B58\u5728\uFF0C\u4F46\u65E2\u4E0D\u5728\u4EFB\u4F55\u5DE5\u4F5C\u533A\u6210\u5458\u8868\u91CC\u3001cwd \u4E5F\u6CA1\u6709\u5BF9\u5E94\u7684\u5DE5\u4F5C\u533A\uFF08\u591A\u4E3A\u5B50\u4EE3\u7406\u4EA7\u7269\uFF0C\u6216\u76EE\u5F55\u88AB\u624B\u5DE5\u5220/\u642C\u8FC7\uFF09\u3002 \u78C1\u76D8\u5360\u7528\u7EA6 ",(R/1024/1024).toFixed(1)," MB\u3002"]}),(0,g.jsx)("div",{className:"wb-diag-actions",children:(0,g.jsxs)("button",{type:"button",className:"wb-ghost-btn wb-danger",disabled:b,onClick:()=>K(A.map(p=>p.sessionId)),children:["\u6E05\u7406\u5168\u90E8\uFF08",A.length,"\uFF09"]})}),(0,g.jsx)("ul",{className:"wb-diag-list",children:A.slice(0,30).map(p=>(0,g.jsxs)("li",{children:[(0,g.jsx)("span",{className:`wb-tag ${p.origin==="subagent"?"is-sub":""}`,children:p.origin??"\u672A\u77E5"}),(0,g.jsx)("span",{className:"t",children:p.title??"(\u65E0\u6807\u9898)"}),(0,g.jsx)("span",{className:"p mono",children:(p.sizeBytes??0)/1024>1024?`${((p.sizeBytes??0)/1024/1024).toFixed(1)} MB`:`${Math.round((p.sizeBytes??0)/1024)} KB`}),(0,g.jsx)("span",{className:"when num",children:ne(p.createdAt)}),(0,g.jsx)("button",{type:"button",className:"wb-ghost-btn",disabled:b,onClick:()=>u(p.sessionId),children:"\u5F52\u6863"}),(0,g.jsx)("button",{type:"button",className:"wb-ghost-btn wb-danger",disabled:b,onClick:()=>K([p.sessionId]),children:"\u5220\u9664"})]},p.sessionId))}),A.length>30&&(0,g.jsxs)("p",{className:"wb-diag-hint",children:["\u5217\u8868\u53EA\u663E\u793A\u524D 30 \u6761\uFF1B\u6E05\u7406\u52A8\u4F5C\u8986\u76D6\u5168\u90E8 ",A.length," \u6761\u3002"]})]})]}),E.length>0&&(0,g.jsxs)("section",{className:"wb-diag",children:[(0,g.jsxs)("h4",{children:["\u672A\u767B\u8BB0\u4F46\u76EE\u5F55\u4ECD\u5728",(0,g.jsx)("span",{className:"cnt num",children:E.length})]}),(0,g.jsx)("p",{className:"wb-diag-hint",children:"\u8FD9\u4E9B\u4F1A\u8BDD\u7684 cwd \u4ECD\u662F\u4E00\u4E2A\u5DF2\u6CE8\u518C\u5DE5\u4F5C\u533A\uFF0C\u53EA\u662F\u6210\u5458\u8868\u91CC\u6CA1\u6709\u8BB0\u5F55\u2014\u2014\u6253\u5F00\u4E00\u6B21\u5BBF\u4E3B\u5C31\u4F1A\u91CD\u65B0\u767B\u8BB0\u3002 \u6240\u4EE5\u8FD9\u91CC\u53EA\u63D0\u4F9B\u300C\u6253\u5F00\u4F1A\u8BDD\u300D\uFF0C\u4E0D\u63D0\u4F9B\u5220\u9664\u3002"}),(0,g.jsx)("ul",{className:"wb-diag-list",children:E.slice(0,30).map(p=>(0,g.jsxs)("li",{children:[(0,g.jsx)("span",{className:"wb-tag",children:p.origin??"\u672A\u77E5"}),(0,g.jsx)("span",{className:"t",children:p.title??"(\u65E0\u6807\u9898)"}),(0,g.jsx)("span",{className:"p mono",children:p.cwd??"\u2014"}),(0,g.jsx)("button",{type:"button",className:"wb-ghost-btn",disabled:b||!n,onClick:()=>n?.(p.sessionId),children:"\u6253\u5F00\u4F1A\u8BDD"})]},p.sessionId))})]}),(0,g.jsxs)("section",{className:"wb-diag",children:[(0,g.jsxs)("h4",{children:["\u5F52\u6863\u7F13\u5B58\u6B8B\u7559",(0,g.jsx)("span",{className:"cnt num",children:T})]}),(0,g.jsx)("p",{className:"wb-diag-hint",children:"\u5F52\u6863\u7F13\u5B58\u91CC\u6709\u3001\u4F46\u65E2\u4E0D\u5728\u5BBF\u4E3B\u7684\u5F52\u6863\u96C6\u5408\u3001\u4E5F\u6CA1\u6709\u8F6C\u5F55\u6587\u4EF6\u7684\u8BB0\u5F55\u3002\u5B83\u4EEC\u4F1A\u8BA9\u5DF2\u5220\u9664\u7684\u4F1A\u8BDD\u4EE5\u300C\u65E0\u6807\u9898\u300D\u5E7D\u7075\u884C\u56DE\u6765\uFF1B \u5220\u9664\u4F1A\u8BDD\u65F6\u63D2\u4EF6\u4F1A\u81EA\u52A8\u6E05\u7406\u5BF9\u5E94\u8BB0\u5F55\uFF0C\u5176\u4F59\u7B49\u5BBF\u4E3B\u81EA\u5DF1\u6536\u655B\u3002"})]})]})]})})}var m=require("react/jsx-runtime"),Mn=320,Jt=2,Tn=(()=>{try{return/mac|iphone|ipad/i.test(navigator.platform||navigator.userAgent)}catch{return!1}})(),zn=Tn?"\u2318K":"Ctrl K";function Yt({fetchStateFn:t=mt,getUiWorkspace:n,getWorkspaces:o}){let[i,l]=y(null),[b,c]=y(null),[v,k]=y({kind:"l1"}),[w,S]=y(""),[T,A]=y(!1),[E,R]=y([]),[K,u]=y(()=>ke("contentSearch"));L(()=>Pt(()=>u(ke("contentSearch"))),[]);let[p,f]=y(!1),[D,ce]=y(null),[se,pe]=y(null),[ge,Z]=y(!1),[ae,Q]=y(null);L(()=>{if(!ae)return;let x=window.setTimeout(()=>Q(null),6e3);return()=>window.clearTimeout(x)},[ae]);let ee=Me(null),[j,be]=y(()=>{try{return localStorage.getItem("dshw-theme")||"light"}catch{return"light"}});L(()=>{Pe||document.documentElement.setAttribute("data-theme",j);try{localStorage.setItem("dshw-theme",j)}catch{}},[j]);let le=()=>{t().then(x=>l(x),x=>c(String(x)))};L(()=>{let x=!0;return t().then(N=>x&&l(N),N=>x&&c(String(N))),()=>{x=!1}},[t]),L(()=>{if(!Pe)return;let x=null;try{x=new EventSource("/dsh-overview/events"),x.addEventListener("hello",()=>le()),x.addEventListener("change",()=>le())}catch{}return()=>x?.close()},[]);let G=U(()=>i&&T?$t(i,w):[],[i,T,w]),ue=U(()=>i&&E.length>0?Et(i,E):[],[i,E]);L(()=>{let x=w.trim();if(!Pe||!K||!T||x.length<Jt){R([]),f(!1),ce(null);return}let N=new AbortController,J=!1;f(!0);let W=window.setTimeout(()=>{vt(x,{signal:N.signal}).then(s=>{J||(R(s.hits),f(!1),ce(null))},s=>{J||N.signal.aborted||(R([]),f(!1),ce(String(s?.message??s)))})},Mn);return()=>{J=!0,window.clearTimeout(W),N.abort()}},[w,T,K]);let te=De(It,Mt),H=te.ready?te.ids:null;if(L(()=>{let x=N=>{(N.ctrlKey||N.metaKey)&&N.key.toLowerCase()==="k"?(N.preventDefault(),ee.current?.focus(),A(!0)):N.key==="Escape"&&T&&(S(""),A(!1),ee.current?.blur())};return document.addEventListener("keydown",x),()=>document.removeEventListener("keydown",x)},[T]),b)return(0,m.jsx)("div",{className:"wb-root",children:(0,m.jsxs)("div",{className:"wb-empty-state",role:"alert",children:[(0,m.jsx)("h2",{children:"\u6570\u636E\u6682\u4E0D\u53EF\u7528"}),(0,m.jsx)("p",{children:b}),(0,m.jsx)("p",{children:"DSH \u5B58\u50A8\u8BFB\u53D6\u5931\u8D25\uFF0C\u5BBF\u4E3B\u4E3B\u6D41\u7A0B\u4E0D\u53D7\u5F71\u54CD\u3002"})]})});if(!i)return(0,m.jsx)("div",{className:"wb-root",children:(0,m.jsx)("div",{className:"wb-empty-state",children:"\u52A0\u8F7D\u4E2D\u2026"})});let q=x=>{A(!1),S(""),k({kind:"l2",projectId:x}),window.scrollTo({top:0})},me=x=>{let N=n?.();return N?.openSession?(A(!1),S(""),N.openSession(x),!0):!1},V=x=>{if(x.kind==="content"&&x.sessionId){pe({sessionId:x.sessionId,sessionTitle:x.sessionTitle,query:w.trim()}),A(!1);return}x.sessionId&&me(x.sessionId)||q(x.projectId)},X=(x,N)=>pe({sessionId:x,sessionTitle:N,query:""}),O=v.kind==="l2"?i.projects.find(x=>x.id===v.projectId):null,de=G.length===0&&ue.length===0;return(0,m.jsxs)("div",{className:"wb-root","data-wb-theme":j,children:[(0,m.jsx)("header",{className:"wb-topbar",children:(0,m.jsxs)("div",{className:"wb-topbar-inner",children:[(0,m.jsxs)("div",{className:"wb-brand",children:[(0,m.jsx)("span",{className:"wb-brand-mark",children:(0,m.jsx)("i",{})}),"\u5168\u666F\u6982\u89C8"]}),(0,m.jsxs)("div",{className:"wb-search",children:[(0,m.jsxs)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[(0,m.jsx)("circle",{cx:"11",cy:"11",r:"7"}),(0,m.jsx)("path",{d:"M20 20l-3.5-3.5"})]}),(0,m.jsx)("input",{ref:ee,type:"search",placeholder:"\u641C\u7D22\u4F1A\u8BDD\u3001\u5F85\u529E\u3001\u6B63\u6587","aria-label":"\u8DE8\u9879\u76EE\u641C\u7D22\u9879\u76EE\u3001\u4F1A\u8BDD\u3001\u5F85\u529E\u4E0E\u6B63\u6587",value:w,onChange:x=>{S(x.target.value),A(!0)},onFocus:()=>A(!0),onBlur:()=>window.setTimeout(()=>A(!1),150)}),(0,m.jsx)("span",{className:"wb-kbd","aria-hidden":"true",children:zn}),T&&w.trim()&&(0,m.jsxs)("div",{className:"wb-search-pop",role:"listbox","aria-label":"\u641C\u7D22\u7ED3\u679C",children:[de&&!p&&(0,m.jsx)("div",{className:"none",children:w.trim().length<Jt?"\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE\u3001\u4F1A\u8BDD\u6216\u5F85\u529E":D?`\u6B63\u6587\u68C0\u7D22\u5931\u8D25\uFF1A${D}`:"\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE\u3001\u4F1A\u8BDD\u3001\u5F85\u529E\u6216\u6B63\u6587"}),G.map(x=>(0,m.jsxs)("div",{className:"wb-search-group",children:[(0,m.jsx)("div",{className:"grp",children:x.projectTitle}),x.hits.map((N,J)=>(0,m.jsxs)("button",{type:"button",className:"sr",onMouseDown:W=>W.preventDefault(),onClick:()=>V(N),children:[(0,m.jsx)("div",{children:We(N.text,w).map((W,s)=>W.hit?(0,m.jsx)("mark",{children:W.text},s):(0,m.jsx)("span",{children:W.text},s))}),(0,m.jsx)("div",{className:"p",children:N.kind==="todo"?`\u5F85\u529E \xB7 ${N.sessionTitle??N.sessionId??""}`:N.kind==="project"?"\u9879\u76EE":"\u4F1A\u8BDD"})]},`${N.kind}-${N.sessionId??"project"}-${J}`))]},x.projectId)),ue.length>0&&(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)("div",{className:"wb-search-sect",children:"\u6B63\u6587\u547D\u4E2D \xB7 \u70B9\u51FB\u53EA\u8BFB\u9884\u89C8"}),ue.map(x=>(0,m.jsxs)("div",{className:"wb-search-group",children:[(0,m.jsx)("div",{className:"grp",children:x.projectTitle}),x.hits.map((N,J)=>(0,m.jsxs)("button",{type:"button",className:"sr",onMouseDown:W=>W.preventDefault(),onClick:()=>V(N),children:[(0,m.jsx)("div",{children:Rt(N.text,N.ranges).map((W,s)=>W.hit?(0,m.jsx)("mark",{children:W.text},s):(0,m.jsx)("span",{children:W.text},s))}),(0,m.jsx)("div",{className:"p",children:`\u6B63\u6587 \xB7 ${N.role==="user"?"\u7528\u6237":"\u52A9\u624B"} \xB7 ${N.sessionTitle??"\u672A\u547D\u540D\u4F1A\u8BDD"}`})]},`content-${N.sessionId}-${N.seq??J}`))]},`c-${x.projectId}`))]}),p&&(0,m.jsx)("div",{className:"none",children:"\u6B63\u5728\u68C0\u7D22\u6B63\u6587\u2026"})]})]}),(0,m.jsxs)("div",{className:"wb-top-actions",children:[(0,m.jsxs)("span",{className:"wb-fresh num",title:`\u6570\u636E\u65F6\u95F4\uFF1A${i?new Date(i.generatedAt).toLocaleString():"\u2014"}`,children:["\u6700\u8FD1\u6D3B\u52A8 \xB7 ",(0,m.jsx)("b",{children:qe(i?.generatedAt??null)})]}),(0,m.jsxs)("button",{type:"button",className:"wb-newbtn",onClick:()=>Q("\u5BBF\u4E3B\u672A\u63D0\u4F9B\u65B0\u5EFA\u9879\u76EE\u5165\u53E3\uFF1A\u9879\u76EE\u7531\u6253\u5F00\u7684\u5DE5\u4F5C\u533A\u81EA\u52A8\u805A\u5408\u5230\u8FD9\u91CC"),children:[(0,m.jsx)(z,{name:"folder-plus",size:14}),"\u65B0\u5EFA\u9879\u76EE"]}),(0,m.jsx)("button",{type:"button",className:"wb-iconbtn",onClick:()=>be(j==="dark"?"light":"dark"),"aria-label":"\u5207\u6362\u6DF1\u6D45\u4E3B\u9898",children:(0,m.jsx)(z,{name:j==="dark"?"sun":"moon",size:16})})]})]})}),ae&&(0,m.jsx)("div",{className:"wb-notewrap",children:(0,m.jsxs)("div",{className:"wb-notebar",role:"status",onClick:()=>Q(null),title:"\u70B9\u51FB\u5173\u95ED",children:[(0,m.jsx)(z,{name:"alert-triangle",size:14}),(0,m.jsx)("span",{children:ae})]})}),v.kind==="l1"||!O?(0,m.jsx)(Bt,{state:i,liveIds:H,onOpenProject:q,onOpenSession:me,getUiWorkspace:n,onOpenDiagnostics:()=>Z(!0)}):(0,m.jsx)(Gt,{state:i,project:O,liveIds:H,getUiWorkspace:n,getWorkspaces:o,onPreview:X,onOpenDiagnostics:()=>Z(!0),onChanged:le,onBack:()=>k({kind:"l1"}),onSwitch:q},O.id),se&&(0,m.jsx)(Vt,{sessionId:se.sessionId,sessionTitle:se.sessionTitle,query:se.query,onClose:()=>pe(null)}),ge&&(0,m.jsx)(Xt,{state:i,onOpenSession:x=>{me(x)||alert("\u5F53\u524D\u73AF\u5883\u65E0\u6CD5\u76F4\u63A5\u6253\u5F00\u4F1A\u8BDD\uFF08\u7F3A\u5C11\u5BBF\u4E3B uiWorkspace \u670D\u52A1\uFF09")},getWorkspaces:o,onChanged:le,onClose:()=>Z(!1)})]})}var Zt=`/* dsh-overview \u8BBE\u8BA1 tokens \u4E0E\u7EC4\u4EF6\u6837\u5F0F
   v0.1.22\uFF1ABase \u4E3B\u9875\u5F0F\u5DE5\u4F5C\u53F0\u4E3B\u9898\uFF08\u767D\u5E95 + \u7D2B accent\uFF0C\u5B9E\u6D4B\u81EA my.feishu.cn/base\uFF09\u3002
   \u5BBF\u4E3B\u5185\u5D4C\u65F6\uFF0C:root \u6BB5\u66FF\u6362\u4E3A --dsw-alias-* \u53D8\u91CF\u6620\u5C04\u3002 */

:root {
  --wb-bg: #ffffff;
  --wb-surface: #ffffff;
  --wb-surface-2: #f5f6f7;
  --wb-ink: #1f2329;
  --wb-ink-2: #545a64; /* 6.95:1 on #fff */
  --wb-ink-3: #6a7078; /* 5.00:1 on #fff / 4.62:1 on surface-2\uFF08\u539F #8f959e \u53EA\u6709 3.02/2.79\uFF09 */
  --wb-line: #e5e6eb;
  --wb-line-strong: #c9cdd4;
  --wb-card-line: #dee0e3;
  --wb-accent: #8046f3; /* 5.14:1 on #fff */
  --wb-accent-deep: #6d35e0; /* 5.58:1 on accent-bg \u2014\u2014 accent \u53E0 accent-bg \u53EA\u6709 4.42\uFF0C\u6DE1\u5316\u573A\u666F\u4E00\u5F8B\u7528 deep */
  --wb-accent-ink: #ffffff;
  --wb-accent-bg: #f1ebfe;
  --wb-accent-line: rgba(128, 70, 243, 0.45);
  --wb-blue: #1a67d6; /* 5.31:1 on #fff / 4.67:1 on blue-bg\uFF08\u539F #3586ff \u53EA\u6709 3.50/3.07\uFF09 */
  --wb-blue-bg: #e8f1ff;
  --wb-amber: #a45600; /* 5.37:1 on #fff / 4.93:1 on amber-bg */
  --wb-amber-bg: #fff4e0;
  --wb-danger: #c62c25; /* 5.54:1 on #fff / 4.85:1 on danger-bg */
  --wb-danger-bg: #fdecec;
  /* \u5706\u89D2\u53EA\u4FDD\u7559 6 \u6863\uFF1Axs \u6807\u8BB0/chip \xB7 sm \u5C0F\u63A7\u4EF6 \xB7 md \u8F93\u5165/\u6309\u94AE \xB7 radius \u5361\u7247 \xB7 lg \u5927\u5BB9\u5668 \xB7 pill \u80F6\u56CA */
  --wb-radius-xs: 4px;
  --wb-radius-sm: 6px;
  --wb-radius-md: 8px;
  --wb-radius: 12px;
  --wb-radius-lg: 14px;
  --wb-radius-pill: 999px;
  /* \u9634\u5F71\u53EA\u4FDD\u7559 4 \u6863\uFF0C\u907F\u514D\u6BCF\u5904 rgba \u5404\u5199\u4E00\u904D */
  --wb-shadow-1: 0 1px 2px rgba(23, 26, 31, 0.07);
  --wb-shadow-2: 0 3px 12px rgba(23, 26, 31, 0.08);
  --wb-shadow-3: 0 10px 28px rgba(23, 26, 31, 0.16);
  --wb-shadow-accent: 0 1px 6px rgba(128, 70, 243, 0.12);
  --wb-shadow-drawer: -18px 0 40px rgba(23, 26, 31, 0.22);
  --wb-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
/* \u6DF1\u8272 token\u3002\u6302\u5728 .wb-root \u81EA\u8EAB\u7684 data-wb-theme \u4E0A\uFF08\u5BBF\u4E3B\u5185\u4E0D\u518D\u6539\u5199 documentElement\uFF09\uFF0C
   \u540C\u65F6\u4FDD\u7559 [data-theme='dark'] .wb-root \u517C\u5BB9 Vite \u6C99\u76D2\u4E0E\u9759\u6001\u9884\u89C8\u9875 */
.wb-root[data-wb-theme='dark'],
[data-theme='dark'] .wb-root {
  --wb-bg: #1b1c1f;
  --wb-surface: #242528;
  --wb-surface-2: #2a2b30;
  --wb-ink: #e8eaed;
  --wb-ink-2: #b7bcc6;
  --wb-ink-3: #9099a3; /* 5.90:1 on bg / 4.89:1 on surface-2\uFF08\u539F #767c86 \u53EA\u6709 4.05/3.36\uFF09 */
  --wb-line: #333539;
  --wb-line-strong: #42464c;
  --wb-card-line: #3a3c41;
  --wb-accent: #a688ff;
  --wb-accent-deep: #b99cff;
  --wb-accent-ink: #14101f;
  --wb-accent-bg: #2e2a3d;
  --wb-accent-line: rgba(166, 136, 255, 0.4);
  --wb-blue: #5aa9ff;
  --wb-blue-bg: #1e2a3d;
  --wb-amber: #e8a33d;
  --wb-amber-bg: #35290f;
  --wb-danger: #ff7a72;
  --wb-danger-bg: #3a2220;
  --wb-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --wb-shadow-2: 0 3px 12px rgba(0, 0, 0, 0.45);
  --wb-shadow-3: 0 10px 28px rgba(0, 0, 0, 0.6);
  --wb-shadow-accent: 0 1px 6px rgba(166, 136, 255, 0.2);
  --wb-shadow-drawer: -18px 0 40px rgba(0, 0, 0, 0.5);
}

.wb-root {
  width: 100%;
  /* 100vh \u800C\u4E0D\u662F 100%\uFF1Adev \u6C99\u76D2\u4E0E\u5BBF\u4E3B\u63D2\u69FD\u7684\u7236\u7EA7\u9AD8\u5EA6\u53E3\u5F84\u4E0D\u540C\uFF0C
     100% \u4F1A\u5728\u7236\u7EA7\u9AD8\u5EA6\u672A\u7EA6\u675F\u65F6\u584C\u6210\u5185\u5BB9\u9AD8\u2014\u2014\u6DF1\u8272\u4E3B\u9898\u53EA\u76D6\u4F4F\u4E0A\u534A\u5C4F\u5C31\u662F\u8FD9\u4E48\u6765\u7684\u3002
     \u5BBF\u4E3B\u63D2\u69FD\u5185\u7531\u4E0B\u9762\u7684 [data-dsh-overview] \u8986\u76D6\u6210 100%\uFF0C\u907F\u514D\u4E0E\u63D2\u69FD\u81EA\u8EAB\u7684\u6EDA\u52A8\u5BB9\u5668\u53E0\u52A0\u51FA\u53CC\u5C42\u6EDA\u52A8 */
  min-height: 100vh;
  box-sizing: border-box;
  background: var(--wb-bg);
  color: var(--wb-ink);
  font-family: 'Segoe UI', 'Microsoft YaHei UI', 'PingFang SC', sans-serif;
  font-size: 13px;
  line-height: 1.6;

  -webkit-font-smoothing: antialiased;
}
/* \u5BBF\u4E3B\u6E32\u67D3\u5C42\u5916\u5C42\u662F height:100%;overflow:auto\uFF08\u89C1 plugin.tsx\uFF09\uFF0C\u8FD9\u91CC\u56DE\u843D\u6210 100% \u800C\u4E0D\u662F\u518D\u53E0 100vh */
[data-dsh-overview] > .wb-root { min-height: 100%; }
/* \u7EC4\u4EF6\u5185\u7EDF\u4E00 border-box\uFF1A\u539F\u6765\u53EA\u6709 .wb-root \u81EA\u5DF1\u8BBE\u4E86\uFF0C\u5B50\u5143\u7D20\u7684 padding \u4F1A\u989D\u5916\u6491\u5BBD
   \uFF08.wb-srow \u662F width:100% + \u5DE6\u53F3\u5404 6px \u5185\u8FB9\u8DDD\uFF0C\u628A\u6574\u884C\u6491\u51FA\u5BB9\u5668 12px\uFF09 */
.wb-root,
.wb-root *,
.wb-root *::before,
.wb-root *::after { box-sizing: border-box; }
.wb-root .mono { font-family: 'Cascadia Code', 'JetBrains Mono', Consolas, monospace; font-size: 11.5px; }
.wb-root .num { font-variant-numeric: tabular-nums; }
.wb-root button { font-family: inherit; font-size: inherit; line-height: inherit; }
.wb-root mark { background: var(--wb-amber-bg); color: var(--wb-amber); border-radius: var(--wb-radius-xs); padding: 0 2px; }
.wb-root .hidden { display: none !important; }

/* ===== \u9876\u680F ===== */
/* \u901A\u680F sticky\uFF1A\u80CC\u666F\u4E0E\u5E95\u7EBF\u94FA\u5230\u5C4F\u5E55\u8FB9\u7F18\uFF0C\u5185\u5BB9\u81EA\u5E26 24px \u9875\u8FB9\u8DDD\uFF08\u4E0E\u5185\u5BB9\u533A\u5BF9\u9F50\uFF09 */
/* \u901A\u680F sticky\uFF1A\u80CC\u666F\u4E0E\u5E95\u7EBF\u94FA\u5230\u5C4F\u5E55\u8FB9\u7F18\uFF1B\u5185\u5BB9\u7531 .wb-topbar-inner \u6536\u8FDB\u4E0E .wb-main \u540C\u5BBD\u7684\u5C45\u4E2D\u5BB9\u5668\uFF0C
   \u8FD9\u6837 1920 / 2560 \u5C4F\u4E0A\u9876\u680F\u54C1\u724C\u4E0E\u5185\u5BB9\u5DE6\u7F18\u4ECD\u7136\u5BF9\u9F50\uFF08\u6B64\u524D\u9876\u680F\u53EA\u6709\u56FA\u5B9A 24px \u5185\u8FB9\u8DDD\uFF0C\u4F1A\u9519\u5F00 (vw\u22121680)/2\uFF09 */
.wb-topbar {
  position: sticky; top: 0; z-index: 20; background: var(--wb-bg);
  border-bottom: 1px solid var(--wb-line);
}
.wb-topbar-inner {
  max-width: 1680px; margin: 0 auto; width: 100%; box-sizing: border-box;
  display: flex; align-items: center; gap: 12px; padding: 11px 24px 10px;
}
.wb-brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.2px; margin-right: 4px; }
.wb-brand-mark { width: 20px; height: 20px; border-radius: var(--wb-radius-sm); background: linear-gradient(135deg, #8046f3, #a05cf8); display: grid; place-items: center; flex-shrink: 0; }
.wb-brand-mark i { width: 7px; height: 7px; border-radius: 2px; background: #fff; display: block; }

/* \u9876\u680F\u641C\u7D22\uFF1A\u5B9A\u5BBD 230\uFF0C\u805A\u7126\u5C55\u5F00\u5230 320\uFF08R4 \u641C\u7D22\u5F39\u5C42\u6302\u5728\u540C\u4E00\u5BB9\u5668\u5185\uFF09\u3002
   flex-shrink \u4EA4\u7ED9\u7A84\u5C4F\uFF1A\u539F\u6765 flex-shrink:0 + \u65E0 min-width:0\uFF0C\u7A84\u89C6\u53E3\u53EA\u80FD\u9760\u9876\u680F\u6EA2\u51FA */
.wb-search { position: relative; width: 230px; min-width: 0; transition: width 160ms var(--wb-ease); }
.wb-search:focus-within { width: 320px; }
.wb-search input {
  width: 100%; height: 31px; padding: 0 34px 0 30px; font-size: 13px; color: var(--wb-ink);
  background: var(--wb-surface-2); border: 1px solid transparent; border-radius: var(--wb-radius-md);
  transition: background 160ms var(--wb-ease), border-color 160ms var(--wb-ease), box-shadow 160ms var(--wb-ease);
}
.wb-search input::placeholder { color: var(--wb-ink-3); }
.wb-search input:focus {
  outline: none; background: var(--wb-surface); border-color: var(--wb-accent);
  box-shadow: var(--wb-shadow-accent);
}
.wb-search > svg { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; stroke: var(--wb-ink-3); fill: none; stroke-width: 1.8; pointer-events: none; }
.wb-search .wb-kbd { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); pointer-events: none; transition: opacity 120ms ease; }
.wb-search:focus-within .wb-kbd { opacity: 0; }
.wb-kbd {
  font-family: 'Cascadia Code', Consolas, ui-monospace, monospace; font-size: 11.5px; line-height: 16px;
  color: var(--wb-ink-3); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-xs); padding: 0 5px; background: var(--wb-surface);
}

.wb-iconbtn {
  width: 30px; height: 30px; display: grid; place-items: center; padding: 0;
  border: none; background: none; border-radius: var(--wb-radius-sm);
  color: var(--wb-ink-2); font-size: 15px; line-height: 1; cursor: pointer;
  transition: all 140ms var(--wb-ease);
}
.wb-iconbtn:hover { background: var(--wb-surface-2); color: var(--wb-ink); }
.wb-iconbtn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-newbtn {
  display: inline-flex; align-items: center; gap: 6px; height: 31px; padding: 0 13px;
  border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-md); font-size: 13px; font-weight: 500;
  background: var(--wb-surface); color: var(--wb-ink); cursor: pointer; flex-shrink: 0;
  transition: all 140ms var(--wb-ease);
}
.wb-newbtn:hover { border-color: var(--wb-line-strong); background: var(--wb-surface-2); }
.wb-newbtn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-newbtn svg { width: 14px; height: 14px; color: var(--wb-ink-2); }
.wb-top-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; }
/* \u6570\u636E\u65B0\u9C9C\u5EA6\uFF1A\u53EA\u56DE\u7B54\u300C\u505C\u4E86\u591A\u4E45\u300D\uFF0C\u7CBE\u786E\u65F6\u523B\u7559\u7ED9\u603B\u89C8\u5361\u7247 */
.wb-fresh { font-size: 12px; color: var(--wb-ink-3); white-space: nowrap; }
.wb-fresh b { font-weight: 500; color: var(--wb-ink-2); }

/* \u63D0\u793A\u6761\uFF08\u7425\u73C0\u8F6F\u5E95\uFF09\uFF1A\u65B0\u5EFA\u5165\u53E3\u9650\u5236\u3001hero \u964D\u7EA7\u8BF4\u660E\u7B49\u4E00\u6B21\u6027\u53CD\u9988\u3002
   \u7EDF\u4E00\u7531 .wb-notewrap \u63D0\u4F9B 24px \u6C9F\u69FD + 1680 \u4E0A\u9650\uFF0CApp \u9876\u5C42\u4E0E hero \u5185\u7684\u63D0\u793A\u6761\u5BBD\u5EA6\u56E0\u6B64\u4E00\u81F4 */
.wb-notewrap { max-width: 1680px; margin: 0 auto; padding: 10px 24px 0; width: 100%; box-sizing: border-box; }
.wb-notebar {
  display: flex; align-items: center; gap: 9px; margin: 0; padding: 9px 13px;
  border-radius: var(--wb-radius); background: var(--wb-amber-bg); color: var(--wb-ink); font-size: 12.5px;
}
.wb-notebar svg { flex-shrink: 0; color: var(--wb-amber); }
.wb-notebar[hidden] { display: none; }

.wb-ghost-btn {
  padding: 6px 13px; font-size: 12.5px; color: var(--wb-ink-2); background: transparent;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm); cursor: pointer;
  transition: all 160ms var(--wb-ease); text-decoration: none;
}
.wb-ghost-btn:hover { color: var(--wb-ink); border-color: var(--wb-line-strong); }
.wb-ghost-btn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* \u4F1A\u8BDD\u884C\u64CD\u4F5C\uFF1A\u56FA\u5B9A\u5360\u4F4D 24px\uFF0Chover/\u805A\u7126\u53EA\u5207\u6362 opacity\u3002
   \u539F\u6765\u662F display:none \u2192 inline-flex \u7A81\u7136\u63D2\u5165 5 \u4E2A 24px \u6309\u94AE\uFF08128px\uFF09\uFF0C\u6807\u9898\u91CD\u65B0\u7701\u7565\u3001meta \u5DE6\u8DF3\uFF0C\u9F20\u6807\u4E00\u8D70\u4E00\u56DE\u5C31\u6296\uFF1B
   \u64CD\u4F5C\u672C\u8EAB\u6536\u8FDB\u4E00\u4E2A\u300C\u22EF\u300D\u83DC\u5355\uFF0C\u884C\u5185\u53EA\u5269 1 \u4E2A Tab \u7AD9\u3002\u53F3\u7AEF meta \u7528 margin-left:auto \u9876\u5230\u8FB9\u4E0A\uFF0C\u8FD9\u91CC\u4E0D\u518D\u62A2 auto\u3002 */
.wb-sact { position: relative; display: flex; align-items: center; justify-content: flex-end; width: 24px; flex-shrink: 0; }
.wb-sact-btn {
  display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0;
  border: 0; background: none; border-radius: var(--wb-radius-sm); cursor: pointer; color: var(--wb-ink-2);
  opacity: 0; transition: opacity 120ms var(--wb-ease), background 120ms var(--wb-ease);
}
.wb-srow:hover .wb-sact-btn,
.wb-srow:focus-within .wb-sact-btn,
.wb-sact.is-open .wb-sact-btn,
.wb-sact-btn:focus-visible { opacity: 1; }
.wb-sact-btn:hover { background: var(--wb-surface-2); color: var(--wb-ink); }
.wb-sact-btn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
/* \u70B9\u7A7A\u767D\u5173\u95ED\u83DC\u5355\uFF1A\u6574\u5C4F\u900F\u660E\u5C42\u538B\u5728\u83DC\u5355\u4E0B\u9762\uFF0839 < 40\uFF09\uFF0C\u65E2\u6321\u4F4F\u8BEF\u70B9\u884C\uFF0C\u53C8\u4E0D\u7528\u5168\u5C40 mousedown \u76D1\u542C */
.wb-sact-scrim { position: fixed; inset: 0; z-index: 39; }
/* \u884C\u5185\u83DC\u5355\uFF1A\u53F3\u4E0B\u5C55\u5F00\u3001\u53F3\u7F18\u5BF9\u9F50\uFF08\u53F3\u7AEF\u5C31\u662F\u89C6\u53E3\u8FB9\uFF09 */
.wb-sact-menu {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 40; min-width: 150px; padding: 4px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-md);
  box-shadow: var(--wb-shadow-3);
}
.wb-sact-menu button {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; border: 0; background: none;
  border-radius: var(--wb-radius-sm); font: inherit; font-size: 12.5px; color: var(--wb-ink); text-align: left; cursor: pointer;
}
.wb-sact-menu button:hover { background: var(--wb-surface-2); }
.wb-sact-menu button svg { flex-shrink: 0; color: var(--wb-ink-2); }
.wb-sact-menu button.wb-danger { color: var(--wb-danger); }
.wb-sact-menu button.wb-danger svg { color: var(--wb-danger); }
/* \u9760\u8FD1\u89C6\u53E3\u5E95\u90E8\u65F6\u6539\u6210\u5411\u4E0A\u5C55\u5F00\uFF0C\u514D\u5F97\u83DC\u5355\u843D\u5230\u89C6\u53E3\u5916\u8FD8\u8981\u6EDA\u52A8\u624D\u770B\u89C1 */
.wb-sact-menu.is-up { top: auto; bottom: calc(100% + 4px); }

/* \u641C\u7D22\u4E0B\u62C9\uFF08R4\uFF1A\u9879\u76EE / \u4F1A\u8BDD / \u5F85\u529E\uFF0C\u6309\u9879\u76EE\u5206\u7EC4\uFF09\u3002\u5BBD\u5EA6\u4E0D\u518D\u8DDF\u968F 230\u2013320px \u7684\u8F93\u5165\u6846\uFF0C
   \u5426\u5219\u957F\u6807\u9898\u53EA\u80FD\u538B\u6210\u4E24\u884C\uFF1B\u53F3\u7F18\u4ECD\u4E0D\u8D85\u51FA\u89C6\u53E3 */
.wb-search-pop {
  position: absolute; top: 38px; left: 0; z-index: 30; width: min(420px, calc(100vw - 48px));
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow-3); overflow: hidden; max-height: 420px; overflow-y: auto;
}
.wb-search-group + .wb-search-group { border-top: 1px solid var(--wb-line); }
.wb-search-group .grp {
  padding: 6px 12px 4px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em;
  color: var(--wb-ink-3); background: var(--wb-surface-2); position: sticky; top: 0;
}
.wb-search-pop .sr {
  display: block; width: 100%; text-align: left; padding: 8px 12px; border: 0; background: none;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); cursor: pointer; overflow: hidden;
}
.wb-search-pop .sr:hover { background: var(--wb-surface-2); }
/* \u6807\u9898\u4E0E\u526F\u884C\u90FD\u5728\u5757\u7EA7 div \u91CC\uFF1A\u5355\u884C\u7701\u7565\u8981\u9760 nowrap + overflow\uFF0C\u5426\u5219\u957F\u6807\u9898\u4F1A\u6491\u6210\u4E24\u884C\u628A\u4E0B\u62C9\u9876\u957F */
.wb-search-pop .sr > div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-search-pop .sr .p { font-size: 11.5px; color: var(--wb-ink-3); }
.wb-search-pop .sr mark { background: var(--wb-accent-bg); color: var(--wb-accent-deep); border-radius: var(--wb-radius-xs); padding: 0 1px; }
.wb-search-pop .none { padding: 14px; text-align: center; color: var(--wb-ink-3); font-size: 12px; }

/* ===== L1 \xB7 \u4E3B\u5C4F ===== */
/* \u5185\u5BB9\u533A\uFF1A\u6EE1\u5BBD + 24px \u9875\u8FB9\u8DDD\uFF08\u5BF9\u9F50\u98DE\u4E66\u4E3B\u9875\u7684\u9875\u9762\u7559\u767D\uFF09\uFF0C\u8D85\u5BBD\u5C4F\u7ED9 1680px \u4E0A\u9650\u9632\u5361\u7247\u62C9\u592A\u957F */
.wb-main {
  max-width: 1680px;
  margin: 0 auto;
  padding: 0 24px 44px;
  width: 100%;
  box-sizing: border-box;
}
/* hero\uFF1A\u5BF9\u8BDD\u5F0F\u8F93\u5165\u6846\u2014\u2014\u9009\u9879\u76EE/\u6A21\u5F0F + \u8F93\u4EFB\u52A1 + \u56DE\u8F66\u5728\u6240\u9009\u9879\u76EE\u5F00\u65B0\u4F1A\u8BDD\uFF08\u8349\u7A3F\u6CE8\u5165\uFF09 */
.wb-hero { padding: 30px 0 0; text-align: center; }
.wb-herobox {
  width: min(660px, 100%); margin: 0 auto; text-align: left;
  background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-lg);
  padding: 9px 10px 8px; box-shadow: var(--wb-shadow-1);
  transition: border-color 140ms var(--wb-ease), box-shadow 140ms var(--wb-ease);
}
.wb-herobox:focus-within { border-color: var(--wb-accent); box-shadow: var(--wb-shadow-accent); }
/* \u9AD8\u5EA6\u7531 Home.tsx \u7684 autosize \u8DDF\u968F\u5185\u5BB9\uFF081 \u884C 38px \u2192 \u6700\u591A 5 \u884C 132px\uFF09\uFF0C\u8D85\u51FA\u624D\u5185\u90E8\u6EDA\u52A8 */
.wb-herobox textarea {
  display: block; width: 100%; min-height: 38px; max-height: 132px; resize: none; overflow-y: auto;
  border: 0; outline: none; background: none; font: inherit; font-size: 14px; line-height: 1.5; color: var(--wb-ink);
}
.wb-herobox textarea::placeholder { color: var(--wb-ink-3); }
.wb-herorow { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }

/* hero \u5E95\u90E8\u7684\u9009\u62E9\u5668 chips\uFF1A\u9879\u76EE / \u6A21\u5F0F / \u6A21\u578B\uFF0C\u6837\u5F0F\u5BF9\u9F50 DSH composer \u7684\u9009\u62E9\u884C */
.wb-sel {
  display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 8px 0 4px;
  border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-md); background: var(--wb-bg);
  font-size: 12.5px; color: var(--wb-ink-2); flex-shrink: 0;
}
.wb-sel:hover { border-color: var(--wb-line-strong); background: var(--wb-surface-2); }
.wb-sel > b { font-weight: 500; color: var(--wb-ink-3); margin-right: 1px; }
.wb-sel select {
  appearance: none; border: 0; outline: none; background: none;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); cursor: pointer;
  max-width: 130px; padding-right: 2px;
}
.wb-sel select:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; border-radius: var(--wb-radius-xs); }
.wb-sel > svg { color: var(--wb-ink-3); }
.wb-sel .wb-mini { width: 18px; height: 18px; font-size: 10.5px; border-radius: var(--wb-radius-xs); }
.wb-pick { position: relative; flex-shrink: 0; }
.wb-pickbtn {
  display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 8px 0 5px;
  border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius-md); font-size: 12.5px; font-weight: 500;
  background: var(--wb-bg); color: var(--wb-ink); cursor: pointer;
  transition: all 140ms var(--wb-ease);
}
.wb-pickbtn:hover { border-color: var(--wb-line-strong); background: var(--wb-surface-2); }
.wb-pickbtn:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-pickbtn svg { color: var(--wb-ink-3); }
/* \u5411\u4E0B\u5C55\u5F00\uFF1Ahero \u7D27\u8D34 sticky \u9876\u680F\uFF0C\u5411\u4E0A\u5F39\u5728 900px \u9AD8\u7A97\u53E3\u91CC\u4F1A\u628A\u83DC\u5355\u9876\u51FA\u89C6\u53E3\uFF086 \u4E2A\u9879\u76EE\u5C31\u9700\u8981 228px\uFF09 */
.wb-pickmenu {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 40;
  width: 290px; max-width: calc(100vw - 48px); max-height: min(296px, 42vh); overflow-y: auto; padding: 5px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow-3);
}
.wb-pickcap { font-size: 11.5px; color: var(--wb-ink-3); padding: 6px 9px 4px; }
.wb-pickitem {
  display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; height: 33px; padding: 0 9px;
  border: 0; background: none; border-radius: var(--wb-radius-md); font: inherit; font-size: 13px; color: var(--wb-ink); cursor: pointer;
}
.wb-pickitem:hover { background: var(--wb-surface-2); }
.wb-pickitem[aria-selected='true'] { background: var(--wb-accent-bg); }
.wb-pickitem .n { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); }
.wb-pickitem .ck { margin-left: 4px; color: var(--wb-accent-deep); visibility: hidden; }
.wb-pickitem[aria-selected='true'] .ck { visibility: visible; }
/* min-width:0 \u7F3A\u4E86\u5C31\u662F\u300C\u4E0D\u7701\u7565\u300D\uFF1Aflex \u5B50\u9879\u9ED8\u8BA4 min-width:auto\uFF0C\u7B49\u4E8E\u5185\u5BB9\u5BBD */
.wb-hint { margin-left: auto; min-width: 0; font-size: 12px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-hint b { color: var(--wb-ink-2); font-weight: 500; }
.wb-send {
  width: 28px; height: 28px; border-radius: 50%; border: 0; padding: 0; flex-shrink: 0;
  display: grid; place-items: center; background: var(--wb-accent); color: var(--wb-accent-ink); cursor: pointer;
  transition: background 140ms var(--wb-ease);
}
.wb-send:hover { background: var(--wb-accent-deep); }
.wb-send:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* \u9879\u76EE\u8272\u5757\uFF08\u6309 id \u54C8\u5E0C\u53D6\u8272\u7684\u8EAB\u4EFD tile\uFF09 */
.wb-mini { width: 20px; height: 20px; border-radius: var(--wb-radius-sm); display: inline-grid; place-items: center; color: #fff; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.wb-mini.sm { width: 14px; height: 14px; border-radius: var(--wb-radius-xs); font-size: 10px; }

/* \u72B6\u6001\u70B9\uFF1A\u7D2B=\u8FD0\u884C\uFF08\u547C\u5438\uFF09 \xB7 \u7070=\u7A7A\u95F2 \xB7 \u7A7A\u5FC3=\u6C89\u5BC2 */
.wb-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
@keyframes wb-breathe { 0%, 100% { box-shadow: 0 0 0 0 rgba(128, 70, 243, 0.35); } 50% { box-shadow: 0 0 0 5px rgba(128, 70, 243, 0); } }
.wb-dot-run { background: var(--wb-accent); box-shadow: 0 0 0 3px var(--wb-accent-bg); animation: wb-breathe 2.2s ease-in-out infinite; }
.wb-dot-idle { background: var(--wb-ink-3); }
.wb-dot-off { background: transparent; border: 1.5px solid var(--wb-ink-3); }

/* \u7EDF\u8BA1\u5361\uFF1A\u6570\u636E\u524D\u7F6E\uFF08\u56FE\u6807 | \u6807\u7B7E+\u5927\u6570\u5B57+\u8BF4\u660E | hover \u7BAD\u5934\uFF09\uFF0C\u70B9\u51FB\u8FDB\u5B50\u5C4F\u3002
   \u53C2\u7167\u98DE\u4E66\u4E3B\u9875\u7684\u5FEB\u6377\u5361\uFF1A\u5747\u5206\u6574\u884C\u94FA\u6EE1\uFF08\u9875\u8FB9\u8DDD\u7531 .wb-main \u63D0\u4F9B\uFF09\uFF0C\u56DB\u5F20\u7B49\u5BBD\u3002 */
.wb-quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 26px 0 0; }
@media (max-width: 1000px) { .wb-quick { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.wb-qcard {
  display: flex; align-items: center; gap: 11px; text-align: left; min-width: 0;
  background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius); padding: 11px 14px;
  font: inherit; color: inherit; cursor: pointer;
  transition: border-color 120ms var(--wb-ease), box-shadow 120ms var(--wb-ease);
}
.wb-qcard:hover { border-color: var(--wb-line-strong); box-shadow: var(--wb-shadow-2); }
.wb-qcard:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-qcard.is-run { border-color: var(--wb-accent-line); }
.wb-qicon { width: 34px; height: 34px; border-radius: var(--wb-radius-md); display: grid; place-items: center; flex-shrink: 0; }
/* \u56DB\u79CD\u8272\u8C03\u7531\u7C7B\u51B3\u5B9A\uFF0C\u4E0D\u518D\u5404\u81EA\u5199\u5185\u8054 style */
.wb-qicon.is-accent { background: var(--wb-accent-bg); color: var(--wb-accent-deep); }
.wb-qicon.is-blue { background: var(--wb-blue-bg); color: var(--wb-blue); }
.wb-qicon.is-amber { background: var(--wb-amber-bg); color: var(--wb-amber); }
.wb-qicon.is-danger { background: var(--wb-danger-bg); color: var(--wb-danger); }
.wb-qbody { min-width: 0; flex: 1; }
.wb-qlabel { font-size: 12px; color: var(--wb-ink-2); }
.wb-qvalue { display: flex; align-items: baseline; gap: 6px; }
.wb-qvalue b { font-size: 17px; font-weight: 600; letter-spacing: -0.2px; font-variant-numeric: tabular-nums; }
.wb-qvalue .delta { font-size: 11.5px; font-weight: 500; color: var(--wb-ink-3); }
.wb-qvalue .delta.hot { color: var(--wb-accent-deep); }
/* display:block \u662F\u7701\u7565\u53F7\u751F\u6548\u7684\u524D\u63D0\uFF1A\u539F\u672C\u662F inline span\uFF0Coverflow/text-overflow \u5168\u88AB\u5FFD\u7565\uFF0C
   \u957F\u8BF4\u660E\uFF08\u300C\u6700\u8FD1 7 \u5929\u6CA1\u6709\u6D3B\u52A8\u300D\u4E4B\u7C7B\u7684\u957F\u53E5\uFF09\u4F1A\u76F4\u63A5\u628A\u5361\u7247\u6491\u5BBD */
.wb-qdesc { display: block; font-size: 11.5px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-qgo {
  width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0;
  color: var(--wb-ink-3); opacity: 0; transform: translateX(-3px);
  transition: opacity 130ms var(--wb-ease), transform 130ms var(--wb-ease);
}
.wb-qcard:hover .wb-qgo, .wb-qcard:focus-within .wb-qgo { opacity: 1; transform: none; }

/* \u9879\u76EE\u603B\u89C8\u6BB5\u5934\uFF1A\u6807\u9898 + \u72B6\u6001 tab + \u89C6\u56FE\u5207\u6362\uFF08\u6570\u636E\u53E3\u5F84\u5728\u9876\u680F\u300C\u6700\u8FD1\u6D3B\u52A8\u300D\uFF0C\u8FD9\u91CC\u4E0D\u518D\u91CD\u590D\uFF09 */
.wb-ovhead { display: flex; align-items: center; gap: 10px; margin: 34px 0 12px; flex-wrap: wrap; }
.wb-ovhead h2 { margin: 0; font-size: 15px; font-weight: 600; }
.wb-ovhead .hint { font-size: 12px; color: var(--wb-ink-3); }
.wb-ovhead .tools { margin-left: auto; display: flex; align-items: center; gap: 8px; }
/* \u4E24\u4E2A\u5206\u6BB5\u63A7\u4EF6\u5E76\u6392\u5728\u540C\u4E00\u884C\uFF1A\u5BB9\u5668\u7EDF\u4E00 34px \u9AD8\u3001\u5185\u5C42\u63A7\u4EF6 28px \u9AD8\uFF0C
   \u539F\u6765 .wb-seg\uFF083+4px padding \u6491\u5230 33px\uFF09\u4E0E .wb-viewseg\uFF082px padding + 23px \u6309\u94AE \u2192 27px\uFF09\u5E95\u8FB9\u5BF9\u4E0D\u9F50 */
.wb-seg { display: inline-flex; align-items: center; gap: 2px; background: var(--wb-surface-2); border-radius: var(--wb-radius-md); padding: 3px; height: 34px; box-sizing: border-box; }
.wb-seg button {
  display: inline-flex; align-items: center; height: 28px;
  border: none; background: transparent; color: var(--wb-ink-2); font-size: 12.5px;
  padding: 0 12px; border-radius: var(--wb-radius-sm); cursor: pointer; transition: all 160ms var(--wb-ease);
}
.wb-seg button:hover { color: var(--wb-ink); }
.wb-seg button[aria-selected='true'] { background: var(--wb-surface); color: var(--wb-ink); font-weight: 600; box-shadow: var(--wb-shadow-1); }
.wb-seg button:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.wb-seg .cnt { opacity: 0.6; margin-left: 4px; }
.wb-viewseg { display: inline-flex; align-items: center; gap: 2px; background: var(--wb-surface-2); border-radius: var(--wb-radius-md); padding: 3px; height: 34px; box-sizing: border-box; }
.wb-viewseg button {
  width: 26px; height: 28px; display: grid; place-items: center; padding: 0;
  border: none; background: transparent; border-radius: var(--wb-radius-sm); color: var(--wb-ink-2); cursor: pointer;
}
.wb-viewseg button[aria-pressed='true'] { background: var(--wb-surface); color: var(--wb-ink); box-shadow: var(--wb-shadow-1); }
.wb-viewseg button:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }

/* \u5BC6\u5EA6\u9879\u76EE\u5361\uFF1A\u72B6\u6001\u70B9+\u540D\u79F0+\u6700\u8FD1 / mono \u8DEF\u5F84 / \u4E09\u683C\u6570\u5B57\u5757 / \u6700\u8FD1\u4F1A\u8BDD\u9875\u811A */
.wb-pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 12px; }
.wb-pcard {
  text-align: left; width: 100%; font: inherit; color: inherit; cursor: pointer;
  background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius);
  padding: 12px 14px 10px; position: relative; min-width: 0;
  transition: border-color 140ms var(--wb-ease), box-shadow 140ms var(--wb-ease);
}
.wb-pcard:hover { border-color: var(--wb-line-strong); box-shadow: var(--wb-shadow-2); }
.wb-pcard:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-pcard.is-run { border-color: var(--wb-accent-line); }
.wb-pcard.is-arch .wb-pname, .wb-pcard.is-arch .wb-ppath, .wb-pcard.is-arch .wb-pfoot .t { color: var(--wb-ink-3); }
.wb-ptop { display: flex; align-items: center; gap: 8px; min-width: 0; }
.wb-pname { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.wb-plast { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); flex-shrink: 0; }
/* display:block \u5FC5\u586B\uFF1Ainline \u5143\u7D20\u4E0A\u7684 nowrap/overflow/ellipsis \u548C margin-top \u90FD\u4E0D\u751F\u6548\uFF0C
   \u957F\u8DEF\u5F84\u4F1A\u6A2A\u5411\u51B2\u51FA\u5361\u7247\uFF08105 \u5B57\u7B26\u7684 Windows \u8DEF\u5F84\u5B9E\u6D4B\u8D8A\u8FC7\u5361\u7247\u53F3\u7F18 200px+\uFF09 */
.wb-ppath { display: block; margin-top: 2px; color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-ptiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 9px; }
.wb-ptile { background: var(--wb-surface-2); border-radius: var(--wb-radius-md); padding: 5px 4px 4px; text-align: center; min-width: 0; }
.wb-ptile b { display: block; font-size: 14px; font-weight: 600; line-height: 1.3; font-variant-numeric: tabular-nums; }
.wb-ptile b.hot { color: var(--wb-amber); }
.wb-ptile span { display: block; font-size: 11.5px; color: var(--wb-ink-3); line-height: 1.35; }
.wb-pfoot {
  display: flex; align-items: center; gap: 10px; margin-top: 9px; padding-top: 8px;
  border-top: 1px solid var(--wb-line); font-size: 12px; color: var(--wb-ink-2);
}
.wb-pfoot .t { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-pfoot .tm { margin-left: auto; font-size: 11.5px; color: var(--wb-ink-3); white-space: nowrap; flex-shrink: 0; }

/* \u5FBD\u7AE0 / \u603B\u89C8\u5217\u8868\u89C6\u56FE */
.wb-badge { font-size: 11.5px; border-radius: var(--wb-radius-xs); padding: 1px 6px; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.wb-badge.run { color: var(--wb-accent-deep); background: var(--wb-accent-bg); }
.wb-badge.warn { color: var(--wb-amber); background: var(--wb-amber-bg); }
.wb-badge.dim { color: var(--wb-ink-3); background: var(--wb-surface-2); }
.wb-lhead, .wb-lrow {
  display: grid; grid-template-columns: 1.2fr 1.3fr 56px 56px 56px 92px 26px;
  align-items: center; gap: 12px; padding: 0 10px;
}
@media (max-width: 900px) {
  .wb-lhead, .wb-lrow { grid-template-columns: 1.3fr 56px 56px 56px 92px 26px; }
  .wb-lhead .pth, .wb-lrow .pth { display: none; }
}
.wb-lhead { height: 34px; margin-top: 2px; font-size: 11.5px; color: var(--wb-ink-3); border-bottom: 1px solid var(--wb-line); }
.wb-lrow {
  height: 42px; width: 100%; text-align: left; font: inherit; color: inherit; cursor: pointer;
  border: none; border-bottom: 1px solid var(--wb-line); background: none;
  transition: background 140ms var(--wb-ease);
}
.wb-lrow:hover { background: var(--wb-surface-2); }
.wb-lrow:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: -2px; }
.wb-lrow .nm { display: flex; align-items: center; gap: 8px; min-width: 0; font-weight: 500; }
.wb-lrow .nm > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-lrow.is-arch .nm > span, .wb-lrow.is-arch .pth { color: var(--wb-ink-3); }
.wb-lrow .pth { color: var(--wb-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-lrow .n { font-size: 12.5px; color: var(--wb-ink-2); text-align: right; font-variant-numeric: tabular-nums; }
.wb-lrow .n.hot { color: var(--wb-amber); font-weight: 600; }
.wb-lrow .tm { font-size: 12px; color: var(--wb-ink-3); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }

/* ===== \u5B50\u5C4F\uFF08\u8FD0\u884C\u4E2D / \u7EE7\u7EED\u5DE5\u4F5C / \u5F85\u529E\uFF09 ===== */
.wb-sub { animation: wb-enter 170ms var(--wb-ease); }
@keyframes wb-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .wb-sub { animation: none; }
  .wb-dot-run { animation: none; }
}
.wb-subhead { display: flex; align-items: center; gap: 11px; padding: 16px 0 14px; flex-wrap: wrap; }
.wb-subhead h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.2px; }
.wb-subhead .hint { font-size: 12px; color: var(--wb-ink-3); }
.wb-subhead .sub-actions { margin-left: auto; display: flex; gap: 8px; }
.wb-runcard {
  display: flex; align-items: center; gap: 13px; text-align: left; width: 100%; font: inherit; color: inherit; cursor: pointer;
  background: linear-gradient(180deg, color-mix(in oklab, var(--wb-accent) 7%, transparent), transparent), var(--wb-surface);
  border: 1px solid var(--wb-accent-line); border-radius: var(--wb-radius); padding: 14px 16px;
  transition: box-shadow 120ms var(--wb-ease);
}
.wb-runcard:hover { box-shadow: var(--wb-shadow-2); }
.wb-runcard:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wb-runcard + .wb-runcard { margin-top: 11px; }
.wb-runcard .breathe { width: 8px; height: 8px; border-radius: 50%; background: var(--wb-accent); flex-shrink: 0; animation: wb-breathe 2.2s ease-in-out infinite; }
.wb-runcard-main { min-width: 0; }
.wb-runcard-main b { display: block; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-runcard-main span { font-size: 12px; color: var(--wb-ink-3); }
.wb-openbtn {
  margin-left: auto; height: 27px; padding: 0 11px; flex-shrink: 0;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-md); font-size: 12px;
  color: var(--wb-ink-2); background: var(--wb-surface); cursor: pointer;
  transition: all 140ms var(--wb-ease);
}
.wb-openbtn:hover { color: var(--wb-accent); border-color: var(--wb-accent); }

.wb-empty-state { padding: 64px 0; text-align: center; color: var(--wb-ink-3); }
.wb-empty-state h2 { font-size: 16px; color: var(--wb-ink-2); margin: 0 0 8px; }
.wb-empty-state p { margin: 0 0 16px; font-size: 12.5px; }

/* ===== L2 ===== */
/* \u8BE6\u60C5\u9875\u5934\uFF1A\u4E00\u884C\u653E\u5B8C\uFF08\u8FD4\u56DE / \u5DE5\u4F5C\u533A\u540D / \u8DEF\u5F84 / \u65B0\u5EFA\u4F1A\u8BDD\uFF09\u3002\u9879\u76EE\u5207\u6362\u56DE L1 \u5361\u7247\u5899\uFF0C
   \u8BE6\u60C5\u9875\u4E0D\u518D\u6302\u7B2C\u4E8C\u4E2A\u5207\u6362\u5668\u2014\u2014\u4E24\u4E2A\u5165\u53E3\u53EA\u8BA9\u300C\u6211\u5728\u54EA\u4E2A\u5DE5\u4F5C\u533A\u300D\u591A\u4E00\u6B21\u89E3\u91CA\u3002 */
.wb-dhead { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; min-height: 30px; flex-wrap: wrap; }
/* \u8FD4\u56DE\u6309\u94AE\uFF1A\u4E24\u4E2A\u5C42\u7EA7\u5171\u7528\u4E00\u4E2A\u89C4\u683C\uFF0828\xD728 + \u540C\u4E00\u4E2A Icon\uFF09\uFF0C\u539F\u6765 Detail \u7528\u6587\u672C\u300C\u2190\u300D26\xD726\u3001
   \u5B50\u5C4F\u7528 SVG 30\xD730\uFF0C\u540C\u4E00\u4EA7\u54C1\u91CC\u4E24\u79CD\u8FD4\u56DE\u89C2\u611F */
.wb-back-btn {
  flex-shrink: 0; width: 28px; height: 28px; display: grid; place-items: center; padding: 0;
  border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm); background: var(--wb-surface);
  color: var(--wb-ink-2); line-height: 1; cursor: pointer;
  transition: all 160ms var(--wb-ease);
}
.wb-back-btn:hover { color: var(--wb-ink); border-color: var(--wb-line-strong); }
.wb-dhead-main { display: flex; align-items: baseline; gap: 10px; min-width: 0; flex: 1; }
.wb-dhead h1 { font-size: 17px; margin: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 46vw; }
/* \u8DEF\u5F84\u4E0E h1 \u540C\u4E00\u4E2A flex \u884C\uFF1A\u90FD\u8981 min-width:0\uFF0C\u5426\u5219 min-width:auto \u4F1A\u6309\u5185\u5BB9\u5BBD\u6491\u5F00\u3001\u7701\u7565\u53F7\u6C38\u8FDC\u4E0D\u89E6\u53D1 */
.wb-dhead .wb-proj-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-proj-path { color: var(--wb-ink-3); }
.wb-new-session { flex-shrink: 0; }
.wb-dead-banner {
  border-left: 3px solid var(--wb-danger); background: var(--wb-surface);
  border-radius: 0 var(--wb-radius-md) var(--wb-radius-md) 0; padding: 8px 12px; margin: 10px 0; font-size: 12.5px; color: var(--wb-ink-2);
}
/* \u56DB\u683C\u7B49\u5BBD KPI\uFF1A\u6807\u7B7E\u5728\u4E0A\u3001\u6570\u503C\u5728\u4E0B\uFF08\u4E0D\u518D\u628A\u6807\u7B7E\u548C\u6570\u5B57\u6324\u6210\u4E00\u884C\uFF09\u3002
   \u7EDF\u8BA1\u8303\u56F4\u5199\u5728\u8FD9\u6761\u7684 title \u91CC\u2014\u2014\u9875\u5934\u5DF2\u7ECF\u5199\u660E\u662F\u54EA\u4E2A\u5DE5\u4F5C\u533A\uFF0C\u6761\u5185\u518D\u5199\u4E00\u904D\u5C31\u662F\u566A\u97F3\u3002
   0 \u503C\u5F31\u5316\u3001\u975E 0 \u52A0\u91CD\uFF1B\u53D8\u5316\u91CF\u8DDF\u6570\u503C\u540C\u4E00\u884C\uFF0C\u4E0D\u53E6\u8D77\u811A\u6CE8\u3002 */
.wb-kpi {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); overflow: hidden;
  margin: 0 0 18px; background: var(--wb-surface); border: 1px solid var(--wb-card-line);
  border-radius: var(--wb-radius);
}
.wb-kpi .kv { display: flex; flex-direction: column; gap: 1px; padding: 9px 14px 8px; min-width: 0; border-left: 1px solid var(--wb-line); }
.wb-kpi .kv:first-child { border-left: 0; }
.wb-kpi .k { font-size: 11.5px; color: var(--wb-ink-3); letter-spacing: 0.2px; }
.wb-kpi .vv { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.wb-kpi .v { font-size: 16px; font-weight: 600; line-height: 1.35; color: var(--wb-ink); font-variant-numeric: tabular-nums; }
.wb-kpi .kv.is-zero .v { color: var(--wb-ink-3); font-weight: 500; }
.wb-kpi .d {
  font-size: 11.5px; color: var(--wb-accent-deep); min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
@media (max-width: 720px) {
  .wb-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .wb-kpi .kv:nth-child(2n + 1) { border-left: 0; }
  .wb-kpi .kv:nth-child(n + 3) { border-top: 1px solid var(--wb-line); }
}
/* \u4FA7\u680F\u5BBD\u5EA6 = \u5185\u5BB9\u533A\u7684 1/4\uFF083fr : 1fr\uFF09\u3002\u672C\u673A 25 \u6761\u5F85\u529E\u5B9E\u6D4B\uFF1A\u4E2D\u4F4D\u6570 31 \u5B57\u3001p90 65 \u5B57\uFF0C
   1/4 \u5728 1440 \u7A97\u53E3\u4E0A\u7EA6 360px\uFF08~24 \u5B57/\u884C\uFF09\uFF0C\u591F\u4E2D\u4F4D\u6570\u4E24\u884C\u8BFB\u5B8C\uFF1B\u518D\u5BBD\u53EA\u4F1A\u8BA9\u4E3B\u5217\u53D8\u6324\u2014\u2014
   1/3 \u5728 1920 \u4E0A\u662F 640px\uFF0C\u5355\u5217\u5F85\u529E\u6491\u4E0D\u4F4F\u90A3\u79CD\u884C\u957F\u3002260px \u662F\u4E0B\u9650\uFF08\u7A84\u7A97\u53E3\u522B\u628A\u5F85\u529E\u538B\u6B7B\uFF09\uFF0C
   1024px \u4EE5\u4E0B\u76F4\u63A5\u5355\u5217\u5806\u53E0\u3002 */
.wb-cols { display: grid; grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr); gap: 22px; align-items: start; }
@media (max-width: 1024px) { .wb-cols { grid-template-columns: 1fr; } }
/* \u5217\u8868\u5934\uFF1Atab \u5728\u5DE6\u3001\u7B5B\u9009/\u6392\u5E8F\u8D34\u53F3\u7AEF\uFF0C\u5171\u7528\u540C\u4E00\u6761\u5E95\u7EBF\uFF08\u7701\u6389\u539F\u6765\u90A3\u4E00\u6574\u884C\u5DE5\u5177\u6761\uFF09 */
.wb-listbar {
  display: flex; align-items: flex-end; gap: 12px;
  border-bottom: 1px solid var(--wb-line); margin-bottom: 4px;
}
.wb-listbar .wb-tabs { flex: 1; min-width: 0; border-bottom: 0; margin-bottom: 0; }
.wb-listctl { display: flex; align-items: center; gap: 2px; margin-left: auto; padding-bottom: 5px; position: relative; }
.wb-ctl {
  display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; font-size: 12px;
  color: var(--wb-ink-2); background: none; border: 0; border-radius: var(--wb-radius-sm); cursor: pointer;
  transition: all 160ms var(--wb-ease);
}
.wb-ctl:hover { color: var(--wb-ink); background: var(--wb-surface-2); }
.wb-ctl.is-on { color: var(--wb-accent-deep); background: var(--wb-accent-bg); }
.wb-ctl .cnt { font-size: 11px; }
.wb-ctl .caret { font-size: 10.5px; opacity: 0.7; }
.wb-pop-scrim { position: fixed; inset: 0; z-index: 35; }
.wb-pop {
  position: absolute; right: 0; top: calc(100% + 2px); z-index: 40; min-width: 180px; padding: 6px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius);
  box-shadow: var(--wb-shadow-3);
}
.wb-pop .pop-hd { padding: 3px 8px 5px; font-size: 11.5px; color: var(--wb-ink-3); }
.wb-pop .pop-row {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 5px 8px;
  border: 0; background: none; border-radius: var(--wb-radius-sm); cursor: pointer;
  font: inherit; font-size: 12.5px; color: var(--wb-ink); text-align: left;
}
.wb-pop .pop-row:hover { background: var(--wb-surface-2); }
.wb-pop .pop-row:disabled { opacity: 0.5; cursor: not-allowed; }
.wb-pop .pop-row .tick { margin-left: auto; color: var(--wb-accent); font-size: 11px; }
.wb-pop .pop-sep { height: 1px; background: var(--wb-line); margin: 5px 4px; }
.wb-listnote { font-size: 11.5px; color: var(--wb-ink-3); padding: 6px 6px 0; }

.wb-tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--wb-line); margin-bottom: 4px; }
.wb-tab {
  background: none; border: none; font-size: 13px; color: var(--wb-ink-2);
  padding: 8px 2px 9px; cursor: pointer; position: relative; transition: color 160ms var(--wb-ease);
}
.wb-tab .cnt { font-size: 11.5px; color: var(--wb-ink-3); margin-left: 3px; }
.wb-tab:hover { color: var(--wb-ink); }
.wb-tab[aria-selected='true'] { color: var(--wb-accent); font-weight: 600; }
.wb-tab[aria-selected='true']::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--wb-accent);
}
.wb-srow {
  display: flex; align-items: center; gap: 10px; padding: 9px 6px; width: 100%; min-height: 40px;
  border: none; border-bottom: 1px solid var(--wb-line); background: none; text-align: left;
  font: inherit; color: inherit; cursor: pointer; transition: background 160ms var(--wb-ease);
}
.wb-srow:hover { background: var(--wb-surface-2); }
.wb-srow:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: -2px; }
/* \u884C\u9AD8\u7EDF\u4E00\uFF1A\u6CA1\u6709\u526F\u6807\u9898\u7684\u884C\u4E5F\u5360\u540C\u6837\u7684\u9AD8\u5EA6\uFF0C\u5217\u8868\u770B\u8D77\u6765\u624D\u662F\u4E00\u6761\u6761\uFF0C\u800C\u4E0D\u662F\u5FFD\u9AD8\u5FFD\u4F4E */
.wb-srow .wb-dot { align-self: flex-start; margin-top: 8px; }
.wb-srow-main { display: block; min-width: 0; flex: 1; }
/* \u6807\u9898\u884C = \u6807\u9898\uFF08\u53EF\u7701\u7565\uFF09+ \u5FBD\u7AE0\uFF08\u4E0D\u6362\u884C\uFF09\u3002\u539F\u6765 .t \u662F block\u3001\u5FBD\u7AE0\u8DDF\u5728\u5176\u540E\uFF0C
   \u5E26\u300C\u5B50\u4F1A\u8BDD / \u7A7A\u58F3\u300D\u7684\u884C\u4F1A\u88AB\u6324\u6210\u4E09\u884C\uFF0C\u540C\u4E00\u5217\u8868\u5FFD\u9AD8\u5FFD\u4F4E */
.wb-srow-t { display: flex; align-items: center; gap: 6px; min-width: 0; }
.wb-srow .t {
  display: block; min-width: 0; flex: 0 1 auto; font-weight: 500; font-size: 13px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* \u7B2C\u4E8C\u884C\uFF1A\u4F1A\u8BDD\u81EA\u5DF1\u8EAB\u4E0A\u7684\u4E8B\u5B9E\uFF08\u5F85\u529E\u6458\u8981 / \u6570\u636E\u6765\u6E90\uFF09\uFF0C\u6CA1\u6709\u5C31\u4E0D\u5360\u884C\u9AD8 */
.wb-srow .sub {
  display: block; margin-top: 1px; font-size: 11.5px; color: var(--wb-ink-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wb-srow .m { color: var(--wb-ink-3); font-size: 11.5px; margin-left: auto; white-space: nowrap; flex-shrink: 0; }
.wb-side-card { background: var(--wb-surface); border: 1px solid var(--wb-card-line); border-radius: var(--wb-radius); padding: 13px 15px; margin-bottom: 14px; }
.wb-side-card h3 { margin: 0 0 9px; font-size: 12px; font-weight: 600; color: var(--wb-ink-2); letter-spacing: 0.3px; }
.wb-feed { font-size: 12.5px; }
.wb-feed .f { display: flex; gap: 9px; padding: 4px 0; color: var(--wb-ink-2); }
.wb-feed .f::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--wb-line-strong); margin-top: 7px; flex-shrink: 0; }
.wb-feed .f:first-child::before { background: var(--wb-accent); }
.wb-feed .f .w { margin-left: auto; color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }
.wb-side-empty { color: var(--wb-ink-3); font-size: 12px; padding: 4px 0; }

/* ===== \u5F85\u529E / \u6279\u91CF / \u6574\u7406\uFF08P3\uFF09 ===== */

/* \u65E7\u8DEF\u5F84\u63D0\u793A\uFF1A\u9879\u76EE\u6539\u540D\u6216\u642C\u76EE\u5F55\u540E\uFF0C\u4F1A\u8BDD\u7684 cwd \u8FD8\u505C\u5728\u65E7\u5740 */
.wb-stale-banner {
  border-left: 3px solid var(--wb-amber); background: var(--wb-surface);
  border-radius: 0 var(--wb-radius-md) var(--wb-radius-md) 0; padding: 8px 12px; margin: 10px 0; font-size: 12.5px; color: var(--wb-ink-2);
}
.wb-stale-banner .mono { color: var(--wb-ink); }

/* \u53F3\u680F\u300C\u8BCA\u65AD\u4E0E\u53D8\u66F4\u300D\u65F6\u95F4\u7EBF\uFF1A\u70B9 + \u4E00\u53E5\u8BDD + \u53F3\u4FA7\u76F8\u5BF9\u65F6\u95F4\u3002\u62FF\u4E0D\u5230\u65F6\u95F4\u5C31\u4E0D\u5199\uFF0C\u4E0D\u7F16\u65E5\u671F\u3002
   \u5185\u5BB9\u53EA\u6536\u5DE6\u680F\u5217\u8868\u91CC\u6CA1\u6709\u7684\uFF1A\u5F02\u5E38\u8BA1\u6570\u3001\u4ECA\u65E5\u53D8\u5316\u3001\u6B63\u5728\u6267\u884C\u7684\u4F1A\u8BDD\u6570\u3002 */
.wb-timeline { display: flex; flex-direction: column; gap: 1px; }
.wb-tl { display: flex; align-items: baseline; gap: 8px; padding: 4px 0; font-size: 12.5px; color: var(--wb-ink-2); }
.wb-tl .tl-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--wb-line-strong); flex-shrink: 0; position: relative; top: -2px; }
.wb-tl.is-warn .tl-dot { background: var(--wb-amber); }
.wb-tl.is-ok .tl-dot { background: var(--wb-accent); }
.wb-tl .tl-txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-tl .tl-when { margin-left: auto; color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }
.wb-side-foot {
  display: flex; align-items: baseline; gap: 8px; margin-top: 7px; padding-top: 7px;
  border-top: 1px solid var(--wb-line); font-size: 11.5px; color: var(--wb-ink-3);
}
.wb-ghost-btn.is-on { color: var(--wb-accent); border-color: var(--wb-accent-line); background: var(--wb-accent-bg); }
.wb-ghost-btn.is-primary { color: var(--wb-accent-ink); background: var(--wb-accent); border-color: var(--wb-accent); }
.wb-ghost-btn.is-primary:hover { background: var(--wb-accent-deep); border-color: var(--wb-accent-deep); color: var(--wb-accent-ink); }
.wb-ghost-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.wb-ghost-btn.wb-danger:hover { color: var(--wb-danger); border-color: var(--wb-danger); }

.wb-batchbar {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 10px;
  background: var(--wb-surface); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm);
}
.wb-batchbar .n { font-size: 12px; color: var(--wb-ink-2); margin-right: 4px; }

.wb-idle-panel {
  border: 1px solid var(--wb-line); background: var(--wb-surface);
  border-radius: var(--wb-radius); padding: 12px 14px; margin-bottom: 14px;
}
.wb-idle-panel .hd { font-size: 12.5px; color: var(--wb-ink-2); margin-bottom: 8px; }
.wb-idle-panel .hd select {
  margin: 0 4px; font: inherit; font-size: 12px; padding: 2px 4px;
  background: var(--wb-surface-2); color: var(--wb-ink); border: 1px solid var(--wb-line); border-radius: var(--wb-radius-sm);
}
.wb-idle-actions { display: flex; gap: 8px; margin-top: 10px; }
.wb-pick-list { list-style: none; margin: 0; padding: 0; max-height: 260px; overflow-y: auto; }
.wb-pick-list li {
  display: flex; align-items: center; gap: 10px; padding: 4px 0;
  border-bottom: 1px solid var(--wb-line); font-size: 12.5px;
}
.wb-pick-list li:last-child { border-bottom: none; }
.wb-pick-list label { display: flex; align-items: center; gap: 8px; min-width: 0; cursor: pointer; }
.wb-pick-list input { width: 14px; height: 14px; accent-color: var(--wb-accent); flex-shrink: 0; }
.wb-pick-list .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-pick-list .m { margin-left: auto; color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }

/* \u5F85\u529E\u884C\uFF1A\u6B63\u6587\u72EC\u5360\u6574\u884C\uFF0C\u6765\u6E90\u4F1A\u8BDD\u53E6\u8D77\u4E00\u884C\u2014\u2014\u4E24\u8005\u4E0D\u518D\u62A2\u540C\u4E00\u884C\u7684\u5BBD\u5EA6 */
.wb-todo-feed .f { display: block; padding: 6px 0 6px 13px; position: relative; }
.wb-todo-feed .f::before {
  content: ''; position: absolute; left: 0; top: 11px; width: 5px; height: 5px;
  border-radius: 50%; background: var(--wb-line-strong); margin: 0;
}
.wb-todo-feed .f.is-run::before { background: var(--wb-accent); }
.wb-todo-feed .f-txt { display: block; color: var(--wb-ink); }
.wb-todo-feed .f-w {
  display: block; margin-top: 1px; color: var(--wb-ink-3); font-size: 11.5px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.wb-srow.is-picked { background: var(--wb-accent-bg); }
.wb-srow-check { width: 14px; height: 14px; accent-color: var(--wb-accent); flex-shrink: 0; cursor: pointer; }

/* ===== \u62BD\u5C49\uFF1A\u53EA\u8BFB\u9884\u89C8 / \u6570\u636E\u8BCA\u65AD ===== */
.wb-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, 0.42); display: flex; justify-content: flex-end; }
.wb-drawer {
  width: min(680px, 92vw); height: 100%; background: var(--wb-bg); border-left: 1px solid var(--wb-line);
  display: flex; flex-direction: column; box-shadow: var(--wb-shadow-drawer);
}
.wb-drawer-head { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--wb-line); }
.wb-drawer-title { font-size: 14px; font-weight: 600; }
.wb-drawer-sub { font-size: 11.5px; color: var(--wb-ink-3); margin-top: 3px; }
.wb-drawer-head .wb-ghost-btn { margin-left: auto; flex-shrink: 0; }
.wb-drawer-body { padding: 16px 20px 40px; overflow-y: auto; flex: 1; }
.wb-note {
  font-size: 12px; color: var(--wb-ink-2); background: var(--wb-surface-2);
  border-radius: var(--wb-radius-sm); padding: 7px 10px; margin-bottom: 12px;
}

.wb-msg { margin-bottom: 14px; padding-left: 10px; border-left: 2px solid transparent; }
.wb-msg.is-hit {
  border-left-color: var(--wb-accent); background: var(--wb-accent-bg);
  border-radius: 0 var(--wb-radius-sm) var(--wb-radius-sm) 0; padding: 6px 10px;
}
.wb-msg-head { display: flex; gap: 8px; align-items: baseline; font-size: 11.5px; color: var(--wb-ink-3); margin-bottom: 3px; }
.wb-msg-head .who { font-weight: 600; color: var(--wb-ink-2); }
.wb-msg-body { font-size: 12.5px; color: var(--wb-ink); white-space: pre-wrap; word-break: break-word; }

.wb-diag { margin-bottom: 22px; }
.wb-diag h4 { display: flex; align-items: baseline; gap: 8px; font-size: 13px; margin: 0 0 6px; }
.wb-diag h4 .cnt { font-size: 11.5px; color: var(--wb-ink-3); font-weight: 400; }
.wb-diag-hint { font-size: 12px; color: var(--wb-ink-3); margin: 0 0 8px; }
.wb-diag-actions { display: flex; gap: 8px; margin-bottom: 8px; }
.wb-diag-list { list-style: none; margin: 0; padding: 0; }
.wb-diag-list li {
  display: flex; align-items: center; gap: 9px; padding: 6px 0;
  border-bottom: 1px solid var(--wb-line); font-size: 12.5px;
}
.wb-diag-list li .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wb-diag-list li .p {
  color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap;
  max-width: 180px; overflow: hidden; text-overflow: ellipsis;
}
.wb-diag-list li .when { color: var(--wb-ink-3); font-size: 11.5px; white-space: nowrap; }
.wb-diag-list li .wb-ghost-btn { margin-left: auto; padding: 2px 9px; font-size: 11.5px; }
.wb-diag-list li .wb-ghost-btn + .wb-ghost-btn { margin-left: 0; }
/* \u5FBD\u7AE0\uFF1Abase \u5E26 1px \u900F\u660E\u8FB9\u6846\uFF0C\u53D8\u4F53\u624D\u6709\u5730\u65B9\u6539 border-color\uFF08\u6B64\u524D .wb-tag \u6CA1\u6709 border\uFF0C
   is-empty \u8BBE\u7684 border-color \u662F\u7A7A\u5199\uFF09\u3002\u4E5F\u4E0D\u7528\u672A\u5B9A\u4E49\u7684 --wb-warn\uFF0C\u76F4\u63A5\u7528\u7425\u73C0 token */
.wb-tag {
  font-size: 11.5px; line-height: 1.5; padding: 0 6px; border-radius: var(--wb-radius-pill);
  background: var(--wb-surface-2); color: var(--wb-ink-3); white-space: nowrap; flex-shrink: 0;
  border: 1px solid transparent;
}
.wb-tag.is-warn { color: var(--wb-amber); background: var(--wb-amber-bg); }
.wb-tag.is-empty {
  color: var(--wb-amber); background: var(--wb-amber-bg);
  border-color: color-mix(in oklab, var(--wb-amber) 38%, transparent);
}
.wb-tag.is-sub { color: var(--wb-accent-deep); background: var(--wb-accent-bg); }

.wb-search-sect {
  padding: 7px 12px 5px; font-size: 11.5px; font-weight: 600; color: var(--wb-ink-3);
  border-top: 1px solid var(--wb-line); background: var(--wb-surface-2);
}

/* ===== \u63D2\u4EF6\u8BE6\u60C5\u5361\uFF08\u8BBE\u7F6E \u2192 \u63D2\u4EF6 \u2192 \u5168\u666F\u6982\u89C8\uFF09 ===== */
.dsho-cfg { display: flex; flex-direction: column; gap: 2px; padding: 2px 0 4px; }
.dsho-cfg-row {
  display: flex; align-items: center; gap: 14px; padding: 10px 0;
  border-bottom: 1px solid var(--wb-line);
}
.dsho-cfg-row:last-of-type { border-bottom: none; }
.dsho-cfg-txt { min-width: 0; }
.dsho-cfg-label { font-size: 13px; font-weight: 500; color: var(--wb-ink); }
.dsho-cfg-desc { font-size: 12px; line-height: 1.5; color: var(--wb-ink-3); margin-top: 2px; }
.dsho-cfg-hint { font-size: 11.5px; color: var(--wb-ink-3); padding-top: 6px; }

.dsho-switch {
  margin-left: auto; flex-shrink: 0; position: relative; width: 34px; height: 20px;
  border-radius: var(--wb-radius-pill); border: 1px solid var(--wb-line-strong); background: var(--wb-surface-2);
  cursor: pointer; padding: 0; transition: background 120ms ease, border-color 120ms ease;
}
.dsho-switch.is-on { background: var(--wb-accent); border-color: var(--wb-accent); }
.dsho-knob {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; transition: transform 120ms ease; box-shadow: var(--wb-shadow-1);
}
.dsho-switch.is-on .dsho-knob { transform: translateX(14px); }
.dsho-switch:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }

/* ---------- \u5E76\u5165\u5DE5\u4F5C\u533A\uFF08\u9879\u76EE\u6539\u540D/\u642C\u8FC1\u540E\u7684\u8865\u6551\uFF09 ---------- */
.wb-adopt {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin: 10px 0 4px; padding: 10px 12px;
  border: 1px dashed var(--wb-line-strong); border-radius: var(--wb-radius-md);
  background: var(--wb-surface-2); font-size: 12.5px; color: var(--wb-ink-2);
}
.wb-adopt .txt { flex: 1; min-width: 240px; line-height: 1.6; }
.wb-adopt select {
  height: 28px; padding: 0 8px; border-radius: var(--wb-radius-sm); font-size: 12.5px;
  border: 1px solid var(--wb-line-strong); background: var(--wb-surface); color: inherit;
}

/* ---------- \u5F85\u529E\u5361\uFF1A\u4EBA\u5DE5\u5F85\u529E + \u4F1A\u8BDD\u5F85\u529E ---------- */
.wb-side-card h3 .cnt { margin-left: 6px; font-weight: 500; color: var(--wb-ink-3); font-size: 11.5px; }
.wb-side-card h3 .cnt.hot { color: var(--wb-amber); font-weight: 600; }
.wb-side-card h3 { display: flex; align-items: center; gap: 8px; }
.wb-todo-add { display: flex; gap: 6px; margin: 8px 0 6px; }
.wb-todo-add input {
  flex: 1; min-width: 0; height: 28px; padding: 0 8px; font-size: 12.5px;
  border-radius: var(--wb-radius-sm); border: 1px solid var(--wb-line-strong);
  background: var(--wb-surface); color: inherit;
}
.wb-todo-add input:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 1px; }
.wb-todo-add button { flex-shrink: 0; height: 28px; }
.wb-todo-feed .f.f-manual { align-items: flex-start; }
.wb-todo-feed .f.f-manual::before { display: none; }
.wb-todo-feed .f input[type='checkbox'] { margin: 3px 0 0; accent-color: var(--wb-accent); flex-shrink: 0; cursor: pointer; }
.wb-todo-feed .f.is-done .f-txt { color: var(--wb-ink-3); text-decoration: line-through; }
.wb-todo-feed .f-tag {
  flex-shrink: 0; font-size: 11px; line-height: 16px; padding: 0 5px; border-radius: var(--wb-radius-xs);
  color: var(--wb-ink-3); border: 1px solid var(--wb-line-strong);
}
.wb-todo-feed .f-del {
  flex-shrink: 0; width: 18px; height: 18px; line-height: 16px; padding: 0;
  border: 0; background: none; color: var(--wb-ink-3); font-size: 15px; cursor: pointer; border-radius: var(--wb-radius-xs);
}
.wb-todo-feed .f-del:hover { color: var(--wb-danger); background: var(--wb-surface-2); }

/* \u884C\u5185\u6587\u5B57\u6309\u94AE\uFF08\u4F8B\u5982 stale \u63D0\u793A\u91CC\u7684\u300C\u53D6\u6D88\u5E76\u5165\u300D\uFF09\uFF1A\u4E0D\u62A2\u89C6\u89C9\uFF0C\u4F46\u53EF\u70B9 */
.wb-link-btn {
  margin-left: 8px; padding: 0; border: 0; background: none; cursor: pointer;
  color: var(--wb-accent); font-size: inherit; text-decoration: underline; text-underline-offset: 2px;
}
.wb-link-btn:disabled { opacity: 0.5; cursor: default; }

/* ===== \u901A\u7528\u5C0F\u5DE5\u5177 =====
   \u8FD9\u4E9B\u539F\u672C\u6563\u5728 JSX \u91CC\u7684\u5185\u8054 style\uFF08Icon \u7684 flex-shrink\u3001\u7D27\u51D1\u5361\u5185\u8FB9\u8DDD\u3001\u53EF\u70B9\u884C\u624B\u52BF\u3001
   \u53F3\u5BF9\u9F50\u8868\u5934\u3001\u7A7A\u6001\u5185\u8FB9\u8DDD\uFF09\uFF0C\u6536\u6210\u7C7B\u540E\u4E3B\u9898\u4E0E\u5BC6\u5EA6\u8C03\u6574\u53EA\u6539\u4E00\u5904\u3002 */
.wb-ic { flex-shrink: 0; }
.wb-side-card.is-tight { padding: 4px 10px; }
.wb-feed .f.is-click { cursor: pointer; }
.wb-sel-v { color: var(--wb-ink); }
.wb-lhead .r { text-align: right; }
.wb-side-empty.is-pad { padding: 26px 4px; }

/* ===== \u7A84\u5BBD\u9002\u914D =====
   \u539F\u6765\u53EA\u6709 5 \u4E2A\u65AD\u70B9\uFF08quick 2 \u5217 / \u5217\u8868\u9690\u85CF\u8DEF\u5F84 / kpi 2\xD72 / cols \u5355\u5217 / \u51CF\u52A8\u6548\uFF09\uFF0C
   \u9876\u680F\u3001\u8BE6\u60C5\u9875\u5934\u3001hero \u9009\u62E9\u884C\u5B8C\u5168\u6CA1\u6709\u7A84\u5BBD\u7B56\u7565\uFF0C\u7A97\u53E3\u4E00\u7A84\u5C31\u53EA\u5269\u6A2A\u5411\u6EA2\u51FA\u3002
   \u8FD9\u91CC\u6240\u6709\u5185\u8FB9\u8DDD\u53D8\u5316\u90FD\u548C .wb-topbar-inner / .wb-notewrap \u4FDD\u6301\u540C\u4E00\u5957\u6C9F\u69FD\u3002 */
@media (max-width: 900px) {
  .wb-fresh { display: none; } /* \u6570\u636E\u65B0\u9C9C\u5EA6\u8BA9\u4F4D\u7ED9\u641C\u7D22\u6846 */
}
@media (max-width: 720px) {
  .wb-topbar-inner { padding: 9px 16px 8px; gap: 8px; }
  .wb-main { padding: 0 16px 36px; }
  .wb-notewrap { padding: 10px 16px 0; }
  .wb-search { width: 100%; max-width: 200px; }
  .wb-search:focus-within { width: 100%; max-width: 320px; }
  /* \u7A84\u5C4F\u4E0B\u62C9\u6539\u6210\u8D34\u89C6\u53E3\uFF1A\u4ECD\u6309 left:0 \u951A\u5728\u8F93\u5165\u6846\u4E0A\u4F1A\u4ECE\u54C1\u724C\u540D\u4E4B\u540E\u5F00\u59CB\u94FA\uFF0C
     640px \u4E0B 582px \u5BBD\u76F4\u63A5\u6EA2\u51FA\u53F3\u4FA7 81px */
  .wb-search-pop {
    position: fixed; left: 16px; right: 16px; width: auto; top: 54px; max-height: 60vh;
  }
  .wb-newbtn { display: none; } /* \u5BBF\u4E3B\u672A\u63D0\u4F9B\u65B0\u5EFA\u5165\u53E3\uFF0C\u7A84\u5C4F\u4E0D\u503C\u5F97\u4E3A\u5B83\u8BA9\u51FA 100px */
  .wb-dhead { gap: 9px; }
  .wb-dhead h1 { max-width: 56vw; }
  .wb-hero { padding: 20px 0 0; }
  .wb-pgrid { grid-template-columns: 1fr; }
  .wb-drawer { width: 100%; }
  .wb-drawer-body { padding: 14px 16px 32px; }
  .wb-tabs { gap: 14px; }
}
@media (max-width: 520px) {
  .wb-kbd { display: none; }  /* \u89E6\u5C4F\u6CA1\u6709\u5FEB\u6377\u952E\u63D0\u793A\u53EF\u8A00 */
  .wb-hint { display: none; } /* \u9009\u62E9\u884C\u6362\u884C\u540E\u628A\u5BBD\u5EA6\u8BA9\u7ED9\u6309\u94AE */
  .wb-qdesc { white-space: normal; }
  .wb-pcard { padding: 11px 12px 9px; }
}
`;var Ae=require("react/jsx-runtime"),Dn="dsh-overview",Pn=["slots","uiWorkspace","remote","sessions"];function $n(t){let n=De(qt,Wt);return L(()=>{if(!t.sessionId||!t.inputActions?.setDraft)return;let o=Lt(t.sessionId);o&&t.inputActions.setDraft(o.text)},[n,t.sessionId,t.inputActions]),null}function En(){return(0,Ae.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",children:[(0,Ae.jsx)("rect",{x:"2.5",y:"2.5",width:"3.5",height:"7.5",rx:"1",stroke:"currentColor"}),(0,Ae.jsx)("rect",{x:"6.25",y:"2.5",width:"3.5",height:"11",rx:"1",stroke:"currentColor"}),(0,Ae.jsx)("rect",{x:"10",y:"2.5",width:"3.5",height:"6",rx:"1",stroke:"currentColor"})]})}function Qt(t){return F("div",{className:"dsho-cfg-row"},F("div",{className:"dsho-cfg-txt"},F("div",{className:"dsho-cfg-label"},t.label),F("div",{className:"dsho-cfg-desc"},t.desc)),F("button",{type:"button",role:"switch","aria-checked":t.on,"aria-label":t.label,className:t.on?"dsho-switch is-on":"dsho-switch",onClick:()=>t.onChange(!t.on)},F("span",{className:"dsho-knob"})))}function Rn(t){let n=t??{},[o,i]=y(()=>ke("sidebarEntry")),[l,b]=y(()=>ke("contentSearch"));return n.view==="summary"?null:F("div",{className:"dsho-cfg"},F(Qt,{label:"\u4FA7\u680F\u5165\u53E3",desc:"\u5DE6\u4FA7\u680F\u663E\u793A\u5168\u666F\u6982\u89C8\u683C\u5B50\uFF08\u6539\u52A8\u540E\u9700\u5237\u65B0\u9875\u9762\uFF09",on:o,onChange:c=>{i(c),et("sidebarEntry",c)}}),F(Qt,{label:"\u6B63\u6587\u68C0\u7D22",desc:"\u641C\u7D22\u6846\u6309\u9700\u626B\u63CF\u8F6C\u5F55\u6B63\u6587\uFF08\u53EA\u8BFB\uFF0C\u4E0D\u53D1\u7F51\u7EDC\u8BF7\u6C42\u3001\u4E0D\u6FC0\u6D3B\u4F1A\u8BDD\uFF09",on:l,onChange:c=>{b(c),et("contentSearch",c)}}),F("div",{className:"dsho-cfg-hint"},"\u5F00\u5173\u53EA\u5B58\u672C\u673A\u504F\u597D\uFF08localStorage\uFF09\uFF0C\u4E0D\u5199\u5BBF\u4E3B\u914D\u7F6E\uFF1B\u5378\u8F7D\u63D2\u4EF6\u5373\u5F7B\u5E95\u5931\u6548\u3002"))}function Ln(t){let n=()=>{try{let i=t.uiWorkspace;return typeof t.get!="function"?i??null:t.get("uiWorkspace")??i??null}catch{return null}},o=()=>{try{let l=n()?.workspaces;if(l&&typeof l=="object"&&typeof l?.archiveSession=="function")return l;let b=t.workspaces;return b&&typeof b=="object"?b:typeof t.get!="function"?null:t.get("workspaces")??null}catch{return null}};t.effect(()=>{let i=document.createElement("style");return i.id="dsh-overview-style",i.setAttribute("data-plugin","dsh-overview"),i.textContent=Zt,document.head.appendChild(i),()=>i.remove()},"dsh-overview theme"),t.effect(()=>{let i=t.sessions;return Tt(i?.list??null)},"dsh-overview liveness"),ke("sidebarEntry")&&t.slots.inject("sidebar.panellist",()=>t.slots.register({name:"sidebar.panellist",id:"overview",order:2,label:"\u5168\u666F\u6982\u89C8"},()=>F(En))),t.slots.inject("main",()=>t.slots.register({name:"main",key:"overview"},()=>F("div",{style:{height:"100%",overflow:"auto"},"data-dsh-overview":"page"},F(Yt,{getUiWorkspace:n,getWorkspaces:o})))),t.slots.inject("conversation.input.dock",()=>t.slots.register({name:"conversation.input.dock",id:"overview-resume-draft",order:100},i=>F($n,i??{}))),t.slots.inject("plugins.bundle.config",()=>t.slots.register({name:"plugins.bundle.config",key:"dsh-overview"},i=>F(Rn,i??{})))}

		return module.exports;
	}
});
