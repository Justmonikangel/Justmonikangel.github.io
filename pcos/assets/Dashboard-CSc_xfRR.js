import{u as d,j as e,B as x,c as k,C as n}from"./index-D_aAezFB.js";import{r as c}from"./react-CEemyr9j.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=s=>s.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),h=(...s)=>s.filter((t,a,l)=>!!t&&t.trim()!==""&&l.indexOf(t)===a).join(" ").trim();/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var f={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=c.forwardRef(({color:s="currentColor",size:t=24,strokeWidth:a=2,absoluteStrokeWidth:l,className:i="",children:r,iconNode:m,...p},y)=>c.createElement("svg",{ref:y,...f,width:t,height:t,stroke:s,strokeWidth:l?Number(a)*24/Number(t):a,className:h("lucide",i),...p},[...m.map(([g,u])=>c.createElement(g,u)),...Array.isArray(r)?r:[r]]));/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=(s,t)=>{const a=c.forwardRef(({className:l,...i},r)=>c.createElement(b,{ref:r,iconNode:t,className:h(`lucide-${j(s)}`,l),...i}));return a.displayName=`${s}`,a};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=o("MoonStar",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9",key:"4ay0iu"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=o("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=o("SunMedium",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 3v1",key:"1asbbs"}],["path",{d:"M12 20v1",key:"1wcdkc"}],["path",{d:"M3 12h1",key:"lp3yf2"}],["path",{d:"M20 12h1",key:"1vloll"}],["path",{d:"m18.364 5.636-.707.707",key:"1hakh0"}],["path",{d:"m6.343 17.657-.707.707",key:"18m9nf"}],["path",{d:"m5.636 5.636.707.707",key:"1xv1c5"}],["path",{d:"m17.657 17.657.707.707",key:"vl76zb"}]]);function M(){const s=d(a=>a.theme),t=d(a=>a.toggleTheme);return e.jsx(x,{type:"button",variant:"secondary",size:"icon","aria-label":s==="light"?"切换到深色主题":"切换到浅色主题",onClick:t,children:s==="light"?e.jsx(v,{className:"h-4 w-4"}):e.jsx(w,{className:"h-4 w-4"})})}function C({className:s,...t}){return e.jsx("div",{className:k("inline-flex items-center rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-cy-ink-2",s),...t})}const S=["Dashboard","Upload","Report","Therapy","Agent","Community","Doctors","Profile"];function R(){return e.jsxs("div",{className:"mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10",children:[e.jsxs("header",{className:"flex flex-col gap-6 rounded-[32px] border border-white/60 bg-white/45 p-6 shadow-cyster backdrop-blur-xl lg:flex-row lg:items-start lg:justify-between",children:[e.jsxs("div",{className:"max-w-3xl space-y-4",children:[e.jsxs(C,{className:"w-fit",style:{backgroundColor:"color-mix(in srgb, var(--cy-primary) 12%, white)",color:"var(--cy-primary-ink)"},children:[e.jsx(N,{className:"mr-2 h-3.5 w-3.5"}),"Phase P0 · Scaffold"]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("h1",{className:"text-4xl font-semibold tracking-tight text-cy-ink-1 sm:text-5xl",children:"Cyster"}),e.jsx("p",{className:"max-w-2xl text-sm leading-7 text-cy-ink-2 sm:text-base",children:"PCOS 智能咨询平台的 Vite + React + TypeScript 基座已经落地。当前 phase 先交付空壳、主题切换和后续模块的目录骨架，下一 phase 再进入 AppShell 与多路由视图。"})]})]}),e.jsxs("div",{className:"flex items-center gap-3 self-start",children:[e.jsx(M,{}),e.jsx(x,{type:"button",variant:"secondary",children:"P0 Ready"})]})]}),e.jsx("section",{className:"grid gap-5 md:grid-cols-2 xl:grid-cols-4",children:S.map(s=>e.jsxs(n,{className:"space-y-3",children:[e.jsx("p",{className:"text-xs font-medium uppercase tracking-[0.24em] text-cy-ink-3",children:"Module"}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-semibold tracking-tight text-cy-ink-1",children:s}),e.jsx("p",{className:"mt-2 text-sm leading-6 text-cy-ink-2",children:"目录、路由位点和类型边界已预留，细节在后续 phase 逐步填充。"})]})]},s))}),e.jsxs("section",{className:"grid gap-5 lg:grid-cols-[1.2fr_0.8fr]",children:[e.jsxs(n,{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium uppercase tracking-[0.24em] text-cy-ink-3",children:"Acceptance"}),e.jsx("h2",{className:"mt-2 text-2xl font-semibold tracking-tight",children:"P0 验收点"})]}),e.jsxs("ul",{className:"space-y-3 text-sm leading-6 text-cy-ink-2",children:[e.jsx("li",{children:"访问 `/pcos/` 能看到 Cyster 标识。"}),e.jsx("li",{children:"主题切换使用 `localStorage` 持久化。"}),e.jsx("li",{children:"`pcos/_src/` 与 `pcos/legacy/` 目录按架构文档建好。"})]})]}),e.jsxs(n,{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium uppercase tracking-[0.24em] text-cy-ink-3",children:"Notes"}),e.jsx("h2",{className:"mt-2 text-2xl font-semibold tracking-tight",children:"这次保留的 TODO"})]}),e.jsxs("ul",{className:"space-y-3 text-sm leading-6 text-cy-ink-2",children:[e.jsx("li",{children:"P1 再接入完整 AppShell、Rail、Sidebar 与 AgentDock。"}),e.jsx("li",{children:"P4 再让 `src/lib/llm/*` 的 provider 真正发起请求。"}),e.jsx("li",{children:"P5 再把 OCR 与报告校对流程串起来。"})]})]})]})]})}export{R as default};
