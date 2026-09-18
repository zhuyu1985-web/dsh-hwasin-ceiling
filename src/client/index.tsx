import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";

import { installStickyUserRows } from "./installSticky.ts";

const STYLE_ID = "dsh-hwasin-ceiling";
// The pinned bar echoes one message bubble, so it borrows that bubble's own
// measurements and font axis (`--dsh-content-font-size` / `-delta`) instead of
// freezing a size: the Settings font-size preference moves both together.
const STYLES = `
[data-hwasin-ceiling-host]{
  position:sticky;
  top:0;
  z-index:5;
  height:0;
  overflow:visible;
  pointer-events:none;
}
.hwasinCeilingBar{
  position:absolute;
  left:0;
  right:0;
  top:0;
  display:flex;
  justify-content:center;
  padding:10px calc(var(--dsh-composer-side-clearance, 16px) + 16px) 12px;
  background:var(--dsw-alias-bg-base);
  box-shadow:0 18px 20px -14px var(--dsw-alias-bg-base);
  opacity:0;
  transition:opacity 160ms cubic-bezier(0.22, 1, 0.36, 1);
}
.hwasinCeilingBar[data-hwasin-visible]{opacity:1}
.hwasinCeilingBar[hidden]{display:none}
.hwasinCeilingPrompt{
  display:block;
  box-sizing:border-box;
  width:100%;
  max-width:var(--dsh-chat-content-width, 748px);
  margin:0;
  padding:10px 16px;
  border:none;
  border-radius:22px;
  background:var(--dsw-specific-bubble);
  color:var(--dsw-alias-label-primary);
  font:inherit;
  font-size:var(--dsh-content-font-size, 14px);
  line-height:calc(22px + var(--dsh-content-font-delta, 0px));
  text-align:left;
  pointer-events:auto;
  cursor:pointer;
  will-change:transform;
}
.hwasinCeilingPrompt:hover{
  box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l3);
}
.hwasinCeilingPrompt:focus-visible{
  outline:none;
  box-shadow:0 0 0 2px var(--dsw-alias-border-l3);
}
.hwasinCeilingPromptText{
  display:-webkit-box;
  overflow:hidden;
  overflow-wrap:anywhere;
  white-space:normal;
  -webkit-box-orient:vertical;
  -webkit-line-clamp:2;
}
@media (prefers-reduced-motion:reduce){
  .hwasinCeilingBar{box-shadow:none;opacity:1;transition:none}
  .hwasinCeilingPrompt{transition:none}
}
`;

export const inject: string[] = [];

export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_ID)}]`);
    const tag = existing instanceof HTMLStyleElement ? existing : document.createElement("style");
    tag.dataset.plugin = "dsh-hwasin-ceiling";
    tag.dataset.pluginCss = STYLE_ID;
    tag.textContent = STYLES;
    if (existing === null) document.head.appendChild(tag);
    return () => { tag.remove(); };
  }, "dsh-hwasin-ceiling: styles");
  ctx.effect(() => installStickyUserRows(), "dsh-hwasin-ceiling: stick");
}
