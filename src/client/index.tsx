import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";

import { installStickyUserRows } from "./installSticky.ts";

const STYLE_ID = "dsh-hwasin-ceiling";
// The pinned bar echoes one message bubble, so it borrows that bubble's own
// measurements and font axis (`--dsh-content-font-size` / `-delta`) instead of
// freezing a size: the Settings font-size preference moves both together. The
// bar sits one step below the bubble (`- 1px`) so it reads as a compact echo.
//
// Stacking: the harness pins its own transcript chrome on a documented ladder
// (ConversationRoot.module.css) — CodeBlock sticky banners at 6, the pinned
// compaction header / turn rail / sticky composer at 7, back-to-bottom at 8,
// floating panels from 10, dialogs at 1100. The bar belongs in the 7 tier with
// the harness' own pinned headers: above code banners, below every interactive
// overlay another plugin may open.
const STYLES = `
[data-hwasin-ceiling-host]{
  position:sticky;
  top:0;
  z-index:7;
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
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  .hwasinCeilingBar{
    background:color-mix(in srgb, var(--dsw-alias-bg-base) 58%, transparent);
    box-shadow:none;
    -webkit-backdrop-filter:blur(22px) saturate(1.5);
    backdrop-filter:blur(22px) saturate(1.5);
  }
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
  border-radius:14px;
  background:var(--dsw-specific-bubble);
  background:color-mix(in srgb, var(--dsw-specific-bubble) 75%, transparent);
  color:var(--dsw-alias-label-primary);
  font:inherit;
  font-size:calc(var(--dsh-content-font-size, 14px) - 1px);
  line-height:calc(22px + var(--dsh-content-font-delta, 0px) - 1px);
  text-align:left;
  pointer-events:auto;
  cursor:pointer;
  will-change:transform;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-label-primary) 4%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 10px 24px -12px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);
}
.hwasinCeilingPrompt:hover{
  box-shadow:
    inset 0 0 0 1px var(--dsw-alias-border-l3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 12px 28px -12px color-mix(in srgb, var(--dsw-alias-label-primary) 20%, transparent);
}
.hwasinCeilingPrompt:focus-visible{
  outline:none;
  box-shadow:
    inset 0 0 0 1px var(--dsw-alias-border-l3),
    0 0 0 2px var(--dsw-alias-border-l3);
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
