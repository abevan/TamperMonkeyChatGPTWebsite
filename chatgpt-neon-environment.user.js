// ==UserScript==
// @name         ChatGPT Neon Environment (v3 archive)
// @namespace    https://chatgpt.com/
// @version      3.0.0
// @description  Neon sci-fi environment with native ChatGPT controls preserved.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const KEY = 'chatgpt-neon-theme-v3';
  const STYLE = 'chatgpt-neon-style';
  const BACKDROP = 'chatgpt-neon-backdrop';
  const CONTROL = 'chatgpt-neon-control';
  const presets = {
    ultraviolet: ['Cobalt', '#2563eb', '#38bdf8', '#94a3b8', '#050a17', '#0a1530'],
    cyberlime: ['Cyberlime', '#06b6d4', '#a3e635', '#14b8a6', '#03100f', '#09231f'],
    ember: ['Forge', '#e87928', '#fbbf24', '#64748b', '#120d08', '#211711']
  };
  let active = presets[localStorage.getItem(KEY)] ? localStorage.getItem(KEY) : 'ultraviolet';
  let thrust = 0;
  let thrustTimer = 0;
  let observedComposer = null;
  const composerObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => syncHorizon())
    : null;

  const css = `
    :root{--neon-a:#8b5cf6;--neon-b:#22d3ee;--neon-c:#f472b6;--neon-bg:#060711;--neon-panel:#111129;--neon-px:0px;--neon-py:0px;--burn-radius:34px;--burn-inner:18px;--burn-speed:1.3s;--composer-line-y:77%}
    html,body{background:var(--neon-bg)!important} body{overflow-x:hidden} #root,#__next{position:relative;z-index:1;background:transparent!important} main,[class*="bg-token-main-surface-primary"],[class*="bg-token-main-surface-secondary"]{background-color:transparent!important}main [class*="pointer-events-none"][class*="bg-linear-to-t"],main [class*="pointer-events-none"][class*="bg-gradient-to-t"]{background-image:none!important;opacity:0!important}
    #${BACKDROP}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:radial-gradient(circle at 50% 120%,color-mix(in srgb,var(--neon-a) 22%,transparent),transparent 42%),linear-gradient(145deg,#02030a,var(--neon-bg))} #${BACKDROP} *{pointer-events:none!important}
    .neon-aurora{position:absolute;width:65vmax;aspect-ratio:1;border-radius:50%;filter:blur(90px);mix-blend-mode:screen;opacity:.35;animation:neon-drift 22s ease-in-out infinite alternate}.a1{top:-38vmax;left:-22vmax;background:var(--neon-a);transform:translate(calc(var(--neon-px)*-.6),calc(var(--neon-py)*-.6))}.a2{right:-34vmax;bottom:-40vmax;background:var(--neon-b);animation-delay:-10s;animation-duration:28s}.a3{top:24%;left:38%;width:38vmax;background:var(--neon-c);opacity:.16;animation-delay:-17s}@keyframes neon-drift{to{translate:8vw 6vh;scale:1.16;rotate:12deg}}
    .neon-stars{position:absolute;inset:0;opacity:.5;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.5px),radial-gradient(circle,var(--neon-b) 0 1px,transparent 1.8px);background-position:0 0,47px 71px;background-size:137px 137px,211px 211px}.neon-grid{position:absolute;left:-22%;right:-22%;bottom:-34%;height:65%;opacity:.2;transform:perspective(520px) rotateX(59deg);transform-origin:bottom;background-image:linear-gradient(color-mix(in srgb,var(--neon-b) 32%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--neon-b) 32%,transparent) 1px,transparent 1px);background-size:64px 64px;mask-image:linear-gradient(to top,#000,transparent 83%)}.neon-horizon{position:absolute;left:5%;right:5%;top:var(--composer-line-y);bottom:auto;height:2px;background:linear-gradient(90deg,transparent,var(--neon-a),var(--neon-b),var(--neon-c),transparent);box-shadow:0 0 38px 10px color-mix(in srgb,var(--neon-b) 25%,transparent);transition:top .18s ease}
    .neon-orb{position:absolute;width:90px;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--neon-b) 42%,transparent);border-radius:28%;opacity:.32;box-shadow:inset 0 0 28px color-mix(in srgb,var(--neon-a) 15%,transparent),0 0 26px color-mix(in srgb,var(--neon-b) 18%,transparent);animation:neon-orbit 18s ease-in-out infinite alternate}.o1{top:17%;left:22%;rotate:24deg}.o2{top:43%;right:12%;width:70px;border-radius:50%;border-color:color-mix(in srgb,var(--neon-c) 45%,transparent);animation-delay:-9s}@keyframes neon-orbit{to{translate:3vw -4vh;rotate:38deg;scale:1.12}}
    nav,aside,[data-testid="left-sidebar"]{background:linear-gradient(160deg,color-mix(in srgb,var(--neon-panel) 92%,transparent),color-mix(in srgb,var(--neon-bg) 86%,transparent))!important;border-color:color-mix(in srgb,var(--neon-b) 20%,transparent)!important;box-shadow:10px 0 40px #0007;backdrop-filter:blur(25px) saturate(145%)}nav a,aside a{border-radius:13px!important;transition:background .18s,translate .18s}nav a:hover,aside a:hover{translate:3px 0;background:color-mix(in srgb,var(--neon-a) 19%,transparent)!important}
    [data-message-author-role="user"]{border-radius:22px!important;background:linear-gradient(135deg,color-mix(in srgb,var(--neon-a) 28%,#171126),color-mix(in srgb,var(--neon-c) 16%,#0f172a))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--neon-b) 25%,transparent),0 12px 32px #0005}[data-message-author-role="assistant"]{border-radius:22px;filter:drop-shadow(0 10px 26px #0003)}
    [data-message-author-role="assistant"] :is(p,li){max-inline-size:74ch;line-height:1.62;text-wrap:pretty}[data-message-author-role="assistant"] p+p{margin-top:.42em}[data-message-author-role="assistant"] :is(ul,ol){max-inline-size:70ch;margin-block:.55em}[data-message-author-role="assistant"] li+li{margin-top:.22em}[data-message-author-role="assistant"] blockquote{max-inline-size:72ch;margin-block:.65em;padding:.7em 1.1em;border-left:3px solid var(--neon-b)!important;border-radius:0 14px 14px 0;background:linear-gradient(90deg,color-mix(in srgb,var(--neon-b) 12%,transparent),transparent);box-shadow:inset 0 0 24px color-mix(in srgb,var(--neon-b) 5%,transparent)}[data-message-author-role="assistant"] strong{color:color-mix(in srgb,var(--neon-b) 55%,#fff);text-shadow:0 0 14px color-mix(in srgb,var(--neon-b) 26%,transparent)}
    [data-message-author-role="user"] + [data-message-author-role="assistant"],[data-message-author-role="assistant"] + [data-message-author-role="user"]{margin-top:-22px!important}[data-message-author-role]{min-height:0!important;gap:2px!important}[data-message-author-role="user"] > div:first-child{gap:4px!important}[data-message-author-role="user"] button.text-token-text-tertiary{min-height:24px!important;padding:3px 8px!important;border:1px solid color-mix(in srgb,var(--neon-b) 26%,transparent)!important;border-radius:10px!important;color:color-mix(in srgb,var(--neon-b) 82%,#fff)!important;background:color-mix(in srgb,var(--neon-b) 9%,transparent)!important;box-shadow:0 0 12px color-mix(in srgb,var(--neon-b) 12%,transparent)!important;transition:background .16s ease,border-color .16s ease,transform .16s ease!important}[data-message-author-role="user"] button.text-token-text-tertiary:hover{background:color-mix(in srgb,var(--neon-b) 18%,transparent)!important;border-color:color-mix(in srgb,var(--neon-b) 55%,transparent)!important;transform:translateY(-1px)}[data-message-author-role="user"] button.text-token-text-tertiary svg{color:var(--neon-b)!important;filter:drop-shadow(0 0 5px color-mix(in srgb,var(--neon-b) 48%,transparent))}
    div:has(> [data-message-author-role]){gap:4px!important}section:has([data-message-author-role]) > div.text-base{padding-bottom:6px!important}section:has([data-message-author-role="user"]) > div.text-base{padding-top:4px!important}div:has(> div > [data-message-author-role="user"]) > .z-0.flex.justify-end{height:20px!important;min-height:20px!important;overflow:visible}
    [data-message-author-role="user"]{background:transparent!important;box-shadow:none!important;border-radius:0!important;filter:none!important}
    [data-message-author-role="user"] .user-message-bubble-color{position:relative;max-width:min(70%,760px)!important;padding:12px 18px!important;border:1px solid color-mix(in srgb,var(--neon-b) 38%,transparent)!important;border-radius:18px 18px 6px 18px!important;background:linear-gradient(135deg,color-mix(in srgb,var(--neon-a) 28%,#171126),color-mix(in srgb,var(--neon-panel) 88%,transparent) 58%,color-mix(in srgb,var(--neon-b) 13%,#0f172a))!important;box-shadow:inset 0 1px 0 #ffffff18,0 8px 24px #0006,0 0 24px color-mix(in srgb,var(--neon-a) 18%,transparent)!important;backdrop-filter:blur(18px) saturate(135%);transition:border-color .18s ease,box-shadow .18s ease,translate .18s ease!important}
    [data-message-author-role="user"] .user-message-bubble-color::before{content:"";position:absolute;left:-1px;top:14px;bottom:14px;width:3px;border-radius:4px;background:linear-gradient(var(--neon-b),var(--neon-c));box-shadow:0 0 12px color-mix(in srgb,var(--neon-b) 55%,transparent)}
    [data-message-author-role="user"] .user-message-bubble-color:hover{border-color:color-mix(in srgb,var(--neon-b) 66%,transparent)!important;box-shadow:inset 0 1px 0 #ffffff22,0 10px 28px #0007,0 0 30px color-mix(in srgb,var(--neon-b) 22%,transparent)!important;translate:0 -1px}
    [data-type="unified-composer"]{border-color:color-mix(in srgb,var(--neon-b) 32%,#ffffff18)!important;border-radius:24px!important;background:linear-gradient(145deg,color-mix(in srgb,var(--neon-panel) 89%,transparent),color-mix(in srgb,var(--neon-bg) 82%,transparent))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--neon-a) 15%,transparent),0 16px 45px #0008!important;backdrop-filter:blur(24px) saturate(140%);transition:box-shadow .22s ease,border-color .22s ease,background .22s ease,translate .22s ease!important}[data-type="unified-composer"]:focus-within{border-color:color-mix(in srgb,var(--neon-b) 62%,#fff)!important}#prompt-textarea{caret-color:var(--neon-b)!important}
    [role="dialog"]{border:1px solid color-mix(in srgb,var(--neon-b) 26%,transparent)!important;background:linear-gradient(145deg,color-mix(in srgb,var(--neon-panel) 98%,#05050a),color-mix(in srgb,var(--neon-bg) 96%,#000))!important;box-shadow:0 20px 65px #000b!important;backdrop-filter:blur(26px) saturate(135%)}
    [role="menu"],[role="listbox"],[data-radix-menu-content],[data-radix-select-content],[data-radix-popper-content-wrapper] > [role="menu"],[data-radix-popper-content-wrapper] > [role="listbox"]{isolation:isolate;opacity:1!important;border:1px solid color-mix(in srgb,var(--neon-b) 32%,#ffffff18)!important;border-radius:14px!important;background-color:color-mix(in srgb,var(--neon-panel) 98%,#050509)!important;background-image:linear-gradient(145deg,color-mix(in srgb,var(--neon-panel) 98%,#09090f),color-mix(in srgb,var(--neon-bg) 96%,#000))!important;box-shadow:0 18px 50px #000c,0 0 24px color-mix(in srgb,var(--neon-b) 14%,transparent)!important;backdrop-filter:blur(30px) saturate(145%)!important}
    [role="menuitem"],[role="option"]{border-radius:9px!important}[role="menuitem"]:hover,[role="menuitem"][data-highlighted],[role="option"]:hover,[role="option"][data-highlighted]{background:color-mix(in srgb,var(--neon-b) 16%,var(--neon-panel))!important}
    html.light{--neon-bg:#eef2ff!important;--neon-panel:#ffffff!important;color-scheme:light!important}
    html.light,html.light body{color:#172033!important;background:#eef2ff!important}
    html.light #${BACKDROP}{background:radial-gradient(circle at 50% 115%,color-mix(in srgb,var(--neon-b) 20%,transparent),transparent 44%),linear-gradient(145deg,#f8f7ff,var(--neon-bg))!important}
    html.light .neon-aurora{opacity:.2;mix-blend-mode:multiply}html.light .neon-stars{opacity:.24;filter:brightness(.62) saturate(150%)}html.light .neon-grid{opacity:.15}
    html.light nav,html.light aside,html.light [data-testid="left-sidebar"]{color:#172033!important;background:linear-gradient(160deg,#ffffffee,#eef2ffeb)!important;border-color:color-mix(in srgb,var(--neon-b) 24%,#d8deef)!important;box-shadow:10px 0 36px #44506a20!important}
    html.light [role="dialog"]{color:#172033!important;background:linear-gradient(145deg,#fffffff5,#f4f6fff2)!important;border-color:color-mix(in srgb,var(--neon-b) 28%,#d8deef)!important;box-shadow:0 20px 65px #33405a38!important}
    html.light [role="menu"],html.light [role="listbox"],html.light [data-radix-menu-content],html.light [data-radix-select-content],html.light [data-radix-popper-content-wrapper] > [role="menu"],html.light [data-radix-popper-content-wrapper] > [role="listbox"]{color:#172033!important;background-color:#fff!important;background-image:linear-gradient(145deg,#fff,#f2f5ff)!important;border-color:color-mix(in srgb,var(--neon-b) 35%,#d4daea)!important;box-shadow:0 18px 48px #33405a42,0 0 20px color-mix(in srgb,var(--neon-b) 12%,transparent)!important}
    html.light [data-type="unified-composer"]{color:#172033!important;background:linear-gradient(145deg,#fffffff5,#f2f5fff0)!important;box-shadow:inset 0 0 0 1px #ffffffc0,0 14px 38px #44506a30!important}
    html.light [data-message-author-role="user"] .user-message-bubble-color{color:#172033!important;background:linear-gradient(135deg,color-mix(in srgb,var(--neon-a) 14%,#fff),#fff 55%,color-mix(in srgb,var(--neon-b) 11%,#f5f7ff))!important;box-shadow:inset 0 1px 0 #fff,0 8px 24px #44506a26,0 0 20px color-mix(in srgb,var(--neon-a) 12%,transparent)!important}
    html.light [data-message-author-role="assistant"]{color:#172033!important;filter:drop-shadow(0 8px 20px #44506a1a)}html.light [data-message-author-role="assistant"] strong{color:color-mix(in srgb,var(--neon-a) 68%,#172033)}
    html.light [data-message-author-role="assistant"] :is(p,li,blockquote),html.light [data-message-author-role="user"] .user-message-bubble-color{color:#111827!important}html.light [data-message-author-role="assistant"] strong{color:color-mix(in srgb,var(--neon-a) 88%,#111827)!important;text-shadow:0 1px 0 #fff,0 0 10px color-mix(in srgb,var(--neon-a) 20%,transparent)}html.light :is(a,[role="link"]){color:color-mix(in srgb,var(--neon-a) 84%,#172033)!important;font-weight:650}html.light [class*="text-token-text-secondary"]{color:#3d4b63!important}html.light :is([role="dialog"],[role="menu"],[role="listbox"]) :is(button,[role="menuitem"],[role="option"]){color:#111827!important}html.light [role="menuitem"]:hover,html.light [role="menuitem"][data-highlighted],html.light [role="option"]:hover,html.light [role="option"][data-highlighted]{color:#0c1629!important;background:color-mix(in srgb,var(--neon-b) 22%,#fff)!important}html.light [data-type="unified-composer"]{border-color:color-mix(in srgb,var(--neon-b) 48%,#cbd5e1)!important}html.light [data-message-author-role="user"] .user-message-bubble-color{border-color:color-mix(in srgb,var(--neon-b) 52%,#cbd5e1)!important}
    html.light [aria-label="Response actions"] button[data-neon-action-toggle]{color:#075985!important;border-color:#0891b2!important;background:linear-gradient(135deg,#ffffff,#dff7ff)!important;box-shadow:0 4px 14px #0e74902e!important}html.light [aria-label="Response actions"] button[data-neon-action-toggle]:hover{color:#083344!important;border-color:#0e7490!important;background:linear-gradient(135deg,#fff,#c9f1fb)!important}
    html.light [data-message-author-role="user"] button.text-token-text-tertiary{color:#075985!important;border-color:#0891b2!important;background:#f8fdff!important;box-shadow:0 4px 14px #0e749026!important}html.light [data-message-author-role="user"] button.text-token-text-tertiary:hover{color:#083344!important;border-color:#0e7490!important;background:#e5f8fc!important}html.light [data-message-author-role="user"] button.text-token-text-tertiary svg{color:#075985!important;filter:none!important}
    html.light #${CONTROL}::after{color:#0f172a!important;background:#ffffff!important;border:1px solid color-mix(in srgb,var(--neon-b) 48%,#cbd5e1)!important;box-shadow:0 8px 24px #3341552e!important}
    h1{color:transparent!important;background:linear-gradient(100deg,#fff,var(--neon-b),var(--neon-c),#fff)!important;background-size:240% auto!important;background-clip:text!important;-webkit-background-clip:text!important;animation:neon-title 8s linear infinite}html.light h1{background-image:linear-gradient(100deg,#172033,var(--neon-a),var(--neon-b),#172033)!important}@keyframes neon-title{to{background-position:240% center}}::-webkit-scrollbar{width:11px}::-webkit-scrollbar-thumb{border:3px solid var(--neon-bg);border-radius:99px;background:linear-gradient(var(--neon-a),var(--neon-b),var(--neon-c))}
    .neon-thrust [data-type="unified-composer"]{border-color:color-mix(in srgb,var(--neon-b) 72%,#fff)!important;background:linear-gradient(105deg,color-mix(in srgb,var(--neon-panel) 92%,transparent),color-mix(in srgb,var(--neon-a) 18%,var(--neon-panel)),color-mix(in srgb,var(--neon-b) 12%,var(--neon-bg)))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--neon-b) 40%,transparent),0 14px 34px #0008,0 0 var(--burn-radius) color-mix(in srgb,var(--neon-b) 48%,transparent),0 0 var(--burn-inner) color-mix(in srgb,var(--neon-c) 32%,transparent)!important}
    .neon-warning-clean,.neon-warning-shadow-clean{display:none!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important}
    [aria-label="Response actions"]{position:relative;display:flex;align-items:center;gap:2px;margin-block:-9px!important}
    [aria-label="Response actions"] button[data-neon-action-toggle]{display:inline-flex!important;order:-1;align-items:center;justify-content:center;width:30px;height:26px;padding:0;border:1px solid color-mix(in srgb,var(--neon-b) 32%,transparent);border-radius:9px;color:var(--neon-b);background:linear-gradient(135deg,color-mix(in srgb,var(--neon-b) 16%,transparent),color-mix(in srgb,var(--neon-a) 12%,transparent));font-size:0;cursor:pointer;box-shadow:0 0 12px color-mix(in srgb,var(--neon-b) 16%,transparent);transition:transform .18s ease,background .18s ease,border-color .18s ease}
    [aria-label="Response actions"] button[data-neon-action-toggle]::before{content:"";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:translateY(-2px) rotate(45deg);transition:transform .18s ease}
    [aria-label="Response actions"] button[data-neon-action-toggle]:hover{background:color-mix(in srgb,var(--neon-b) 22%,transparent)}
    [aria-label="Response actions"]:not(.neon-actions-open) button:not([data-neon-action-toggle]){display:none!important}
    [aria-label="Response actions"].neon-actions-open button[data-neon-action-toggle]::before{transform:translateY(2px) rotate(225deg)}
    #${CONTROL}{position:fixed;right:22px;bottom:22px;z-index:2147483647;width:56px;height:56px;border:1px solid #ffffff70;border-radius:50%;color:#fff;cursor:pointer;font:700 24px/1 system-ui;background:conic-gradient(from 220deg,var(--neon-a),var(--neon-b),var(--neon-c),var(--neon-a));box-shadow:0 0 0 5px color-mix(in srgb,var(--neon-bg) 80%,transparent),0 14px 38px #0009,0 0 30px color-mix(in srgb,var(--neon-b) 52%,transparent)}#${CONTROL}::after{content:attr(data-label);position:absolute;right:0;bottom:67px;padding:7px 10px;border-radius:9px;color:#fff;opacity:0;background:var(--neon-panel);font:650 12px/1 system-ui;transition:opacity .18s}#${CONTROL}:hover::after{opacity:1}
    @media(max-width:900px){.o2{display:none}#${CONTROL}{right:14px;bottom:14px;width:48px;height:48px}}@media(prefers-reduced-motion:reduce){#${BACKDROP} *,h1{animation:none!important}}
  `;

  function setTheme(name) {
    const [label, a, b, c, bg, panel] = presets[name];
    active = name;
    [['--neon-a',a],['--neon-b',b],['--neon-c',c],['--neon-bg',bg],['--neon-panel',panel]].forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
    const control = document.getElementById(CONTROL);
    if (control) { control.dataset.label = label; control.title = `Theme: ${label}`; }
    localStorage.setItem(KEY,name);
  }

  function applyThrust() {
    const root = document.documentElement;
    root.classList.toggle('neon-thrust', thrust > 0);
    root.style.setProperty('--burn-radius', `${24 + thrust * 4}px`);
    root.style.setProperty('--burn-inner', `${12 + thrust * 2}px`);
  }

  function coolThrust() {
    thrust = Math.max(0, thrust - 1);
    applyThrust();
    if (thrust) thrustTimer = window.setTimeout(coolThrust, 60);
  }

  function igniteThrust(amount = 1) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    thrust = Math.min(6, thrust + amount);
    applyThrust();
    window.clearTimeout(thrustTimer);
    thrustTimer = window.setTimeout(coolThrust, 60);
  }

  function isComposer(target) {
    return target instanceof Element && Boolean(target.closest('[data-type="unified-composer"], #prompt-textarea'));
  }

  function clearWarningOverlay() {
    if (document.querySelector('.neon-warning-shadow-clean')) return;
    const phrase = 'ChatGPT can make mistakes. Check important info.';
    const candidates = document.querySelectorAll('div,span,p');
    for (const element of candidates) {
      if (element.textContent.trim() !== phrase) continue;
      let parent = element.parentElement;
      for (let depth = 0; parent && depth < 4; depth += 1, parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.boxShadow !== 'none') {
          parent.classList.add('neon-warning-shadow-clean');
          break;
        }
      }
    }
  }

  function syncHorizon() {
    const composer = document.querySelector('#prompt-textarea')?.closest('[data-type="unified-composer"]');
    if (!composer) return;
    const top = Math.round(composer.getBoundingClientRect().top);
    document.documentElement.style.setProperty('--composer-line-y', `${Math.max(0, top - 1)}px`);
  }

  function watchComposer() {
    const composer = document.querySelector('#prompt-textarea')?.closest('[data-type="unified-composer"]');
    if (!composer) return;
    if (composer !== observedComposer) {
      if (observedComposer) composerObserver?.unobserve(observedComposer);
      observedComposer = composer;
      composerObserver?.observe(composer);
    }
    syncHorizon();
  }

  function ensureActionDrawer() {
    document.querySelectorAll('[aria-label="Response actions"]').forEach(group => {
      if (group.querySelector('[data-neon-action-toggle]')) return;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.dataset.neonActionToggle = 'true';
      toggle.setAttribute('aria-label', 'Show response actions');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const open = group.classList.toggle('neon-actions-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Hide response actions' : 'Show response actions');
      });
      group.appendChild(toggle);
    });
  }

  function mount() {
    if (!document.getElementById(STYLE)) { const s=document.createElement('style'); s.id=STYLE; s.textContent=css; document.head.append(s); }
    if (!document.getElementById(BACKDROP)) { const b=document.createElement('div'); b.id=BACKDROP; b.setAttribute('aria-hidden','true'); b.innerHTML='<div class="neon-stars"></div><div class="neon-aurora a1"></div><div class="neon-aurora a2"></div><div class="neon-aurora a3"></div><div class="neon-grid"></div><div class="neon-horizon"></div><div class="neon-orb o1"></div><div class="neon-orb o2"></div>'; document.body.prepend(b); }
    if (!document.getElementById(CONTROL)) { const c=document.createElement('button'); c.id=CONTROL; c.type='button'; c.textContent='\u2726'; c.addEventListener('click',()=>{const keys=Object.keys(presets);setTheme(keys[(keys.indexOf(active)+1)%keys.length]);}); document.body.append(c); }
    setTheme(active);
    clearWarningOverlay();
    watchComposer();
    ensureActionDrawer();
  }
  mount();
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(mount,180);}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('focusin', event => { if (isComposer(event.target)) igniteThrust(1); });
  document.addEventListener('input', event => { if (isComposer(event.target)) igniteThrust(1); });
  window.addEventListener('resize', syncHorizon, { passive:true });
})();