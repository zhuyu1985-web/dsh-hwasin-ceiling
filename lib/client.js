window.__ModuleLoader__.load({
	id: "dsh-hwasin-ceiling",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/pickStuckRow.ts
		const PIN = .5;
		const RELEASE = 8;
		/** Last user row that has crossed the scrollport top, with hysteresis so compact styles cannot flicker. */
		function pickPinnedRow(rows, scrollerTop, currentKey) {
			let lastPast;
			let lastPastIndex = -1;
			for (const [index, row] of rows.entries()) if (row.top <= scrollerTop + PIN) {
				lastPast = row.key;
				lastPastIndex = index;
			}
			if (currentKey !== void 0) {
				const currentIndex = rows.findIndex((row) => row.key === currentKey);
				const current = currentIndex === -1 ? void 0 : rows[currentIndex];
				if (lastPastIndex > currentIndex) return lastPast;
				if (current !== void 0 && current.top <= scrollerTop + RELEASE) return currentKey;
			}
			return lastPast;
		}
		//#endregion
		//#region src/client/flattenPrompt.ts
		/** Collapse original line breaks so a short first line does not hide the rest after clamp. */
		function flattenPromptText(text) {
			return text.replace(/\s+/g, " ").trim();
		}
		//#endregion
		//#region src/client/promptBubble.ts
		/**
		* Locating the prompt bubble inside one user row.
		*
		* The transcript is Harness-private markup, not a plugin API. Two marker
		* attributes have already come and gone (`data-time-hover-root`, then
		* `data-actions-reveal`), so the marker list below is only a fast path for
		* builds that still have one: the durable anchor is the actions chrome, which
		* every prompt row appends and which no version has renamed.
		*/
		/** Markers earlier Harness builds put on a prompt row's bubble wrapper. */
		const BUBBLE_MARKERS = ["[data-time-hover-root]", "[data-actions-reveal]"];
		/** The attachment block a prompt row may render above its bubble. */
		const ATTACHMENT_BLOCK = "[data-message-attachments]";
		/**
		* Trailing actions chrome of one prompt row (clock plus copy/branch controls).
		* The row's last button lives inside it; a plugin-injected action may nest its
		* own button deeper, so climb while the parent still holds controls directly.
		*/
		function actionsChrome(row) {
			const buttons = row.querySelectorAll("button");
			let chrome = buttons[buttons.length - 1]?.parentElement ?? null;
			while (chrome !== null && chrome.parentElement !== null && chrome.parentElement.querySelector(":scope > button") !== null) chrome = chrome.parentElement;
			return chrome;
		}
		/** Wrapper whose first element child is the row's message content, or null when the row does not match. */
		function contentWrapper(row, chrome) {
			for (const marker of BUBBLE_MARKERS) {
				const marked = row.querySelector(marker);
				if (marked !== null) return marked;
			}
			const wrapper = chrome?.parentElement ?? null;
			if (wrapper === null || wrapper === row || !row.contains(wrapper)) return null;
			return wrapper;
		}
		/** Element holding a prompt row's message content; the actions chrome is never part of it. */
		function contentOf(row) {
			const chrome = actionsChrome(row);
			const stack = contentWrapper(row, chrome)?.firstElementChild ?? null;
			if (stack instanceof HTMLElement && stack !== chrome && stack.querySelector("button") === null && (stack.textContent ?? "").trim() !== "") return stack;
			let best = row;
			let bestLength = -1;
			for (const element of [row, ...row.querySelectorAll("*")]) {
				if (element.querySelector("button") !== null) continue;
				const length = (element.textContent ?? "").trim().length;
				if (length > bestLength) {
					best = element;
					bestLength = length;
				}
			}
			return best;
		}
		/**
		* The prompt bubble: the first element child of {@link contentOf} that carries
		* message text. A row may also render an attachment block above the bubble and
		* a reference-summary line below it, and both are secondary to the prompt — an
		* attachment label is often longer than a short prompt.
		*/
		function bubbleOf(row) {
			const stack = contentOf(row);
			for (const child of stack.children) {
				if (!(child instanceof HTMLElement)) continue;
				if (child.matches(ATTACHMENT_BLOCK) || child.querySelector(ATTACHMENT_BLOCK) !== null) continue;
				if ((child.textContent ?? "").trim() !== "") return child;
			}
			return stack;
		}
		/** Flattened prompt text the pinned bar shows for one row. */
		function textOf(row) {
			return flattenPromptText(bubbleOf(row).textContent ?? "");
		}
		//#endregion
		//#region src/client/installSticky.ts
		const HOST_ATTR = "data-hwasin-ceiling-host";
		const EASE = "220ms cubic-bezier(0.22, 1, 0.36, 1)";
		const hideTimers = /* @__PURE__ */ new WeakMap();
		function cssEscape(value) {
			if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
			return value.replace(/\\/g, "\\\\").replace(/"/g, "\\'");
		}
		function reducedMotion() {
			return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
		}
		function boxesOf(scroller) {
			const rows = [];
			for (const row of scroller.querySelectorAll("[data-chat-flow-kind=\"user\"][data-chat-anchor-key]")) {
				const key = row.dataset.chatAnchorKey;
				if (key === void 0 || key === "") continue;
				rows.push({
					key,
					top: row.getBoundingClientRect().top,
					row
				});
			}
			return rows;
		}
		function ensureHost(scroller) {
			const existing = scroller.querySelector(`:scope > [${HOST_ATTR}]`);
			if (existing !== null) return existing;
			const host = document.createElement("div");
			host.setAttribute(HOST_ATTR, "");
			host.innerHTML = "<div class=\"hwasinCeilingBar\" hidden><button type=\"button\" class=\"hwasinCeilingPrompt\"><span class=\"hwasinCeilingPromptText\"></span></button></div>";
			scroller.prepend(host);
			return host;
		}
		function clearTransform(prompt) {
			prompt.style.transition = "";
			prompt.style.transform = "";
			prompt.style.transformOrigin = "";
		}
		function placeFrom(prompt, from, to) {
			const scaleX = from.width / Math.max(to.width, 1);
			const scaleY = from.height / Math.max(to.height, 1);
			prompt.style.transition = "none";
			prompt.style.transformOrigin = "top left";
			prompt.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${scaleX}, ${scaleY})`;
		}
		function animateToRest(prompt) {
			prompt.getBoundingClientRect();
			prompt.style.transition = `transform ${EASE}`;
			prompt.style.transform = "none";
		}
		function renderBar(scroller) {
			const host = ensureHost(scroller);
			const bar = host.querySelector(".hwasinCeilingBar");
			const label = host.querySelector(".hwasinCeilingPromptText");
			const prompt = host.querySelector(".hwasinCeilingPrompt");
			if (bar === null || label === null || prompt === null) return;
			const rows = boxesOf(scroller);
			const previous = host.dataset.hwasinPinnedKey;
			const next = pickPinnedRow(rows, scroller.getBoundingClientRect().top, previous);
			const match = rows.find((row) => row.key === next);
			if (next === void 0 || match === void 0) {
				if (previous === void 0 || bar.hidden || hideTimers.has(host)) return;
				hideBar(host, bar, prompt);
				return;
			}
			const pendingHide = hideTimers.get(host);
			if (pendingHide !== void 0) {
				window.clearTimeout(pendingHide);
				hideTimers.delete(host);
			}
			const text = textOf(match.row);
			if (text === "") {
				hideBar(host, bar, prompt);
				return;
			}
			if (previous === next && !bar.hidden && pendingHide === void 0) {
				if (label.textContent !== text) label.textContent = text;
				bindJump(prompt, scroller, next);
				return;
			}
			const from = bubbleOf(match.row).getBoundingClientRect();
			label.textContent = text;
			host.dataset.hwasinPinnedKey = next;
			bar.hidden = false;
			bar.dataset.hwasinVisible = "1";
			bindJump(prompt, scroller, next);
			if (reducedMotion()) {
				clearTransform(prompt);
				return;
			}
			placeFrom(prompt, from, prompt.getBoundingClientRect());
			animateToRest(prompt);
		}
		function hideBar(host, bar, prompt) {
			delete host.dataset.hwasinPinnedKey;
			if (bar.hidden) return;
			clearTransform(prompt);
			const finish = () => {
				hideTimers.delete(host);
				bar.hidden = true;
				delete bar.dataset.hwasinVisible;
				const label = bar.querySelector(".hwasinCeilingPromptText");
				if (label !== null) label.textContent = "";
			};
			if (reducedMotion()) {
				finish();
				return;
			}
			delete bar.dataset.hwasinVisible;
			hideTimers.set(host, window.setTimeout(finish, 170));
		}
		function bindJump(prompt, scroller, key) {
			prompt.onclick = () => {
				scroller.querySelector(`[data-chat-flow-kind="user"][data-chat-anchor-key="${cssEscape(key)}"]`)?.scrollIntoView({
					block: "start",
					behavior: reducedMotion() ? "auto" : "smooth"
				});
			};
		}
		function installStickyUserRows() {
			let frame = 0;
			const refresh = (scroller) => {
				if (frame !== 0) return;
				frame = window.requestAnimationFrame(() => {
					frame = 0;
					renderBar(scroller);
				});
			};
			const onScroll = (event) => {
				const target = event.target;
				if (!(target instanceof HTMLElement) || !target.hasAttribute("data-conversation-scroll")) return;
				refresh(target);
			};
			const onMutate = () => {
				for (const scroller of document.querySelectorAll("[data-conversation-scroll]")) refresh(scroller);
			};
			document.addEventListener("scroll", onScroll, {
				capture: true,
				passive: true
			});
			window.addEventListener("resize", onMutate);
			onMutate();
			return () => {
				document.removeEventListener("scroll", onScroll, true);
				window.removeEventListener("resize", onMutate);
				if (frame !== 0) window.cancelAnimationFrame(frame);
				for (const host of document.querySelectorAll("[data-hwasin-ceiling-host]")) host.remove();
			};
		}
		//#endregion
		//#region src/client/index.tsx
		const STYLE_ID = "dsh-hwasin-ceiling";
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
    background:transparent;
    box-shadow:none;
  }
  .hwasinCeilingBar::before{
    content:"";
    position:absolute;
    inset:0;
    z-index:-1;
    background:color-mix(in srgb, var(--dsw-alias-bg-base) 40%, transparent);
    -webkit-backdrop-filter:blur(22px) saturate(1.5);
    backdrop-filter:blur(22px) saturate(1.5);
    -webkit-mask-image:linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
    mask-image:linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
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
		const inject = [];
		function apply(ctx) {
			ctx.effect(() => {
				const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_ID)}]`);
				const tag = existing instanceof HTMLStyleElement ? existing : document.createElement("style");
				tag.dataset.plugin = "dsh-hwasin-ceiling";
				tag.dataset.pluginCss = STYLE_ID;
				tag.textContent = STYLES;
				if (existing === null) document.head.appendChild(tag);
				return () => {
					tag.remove();
				};
			}, "dsh-hwasin-ceiling: styles");
			ctx.effect(() => installStickyUserRows(), "dsh-hwasin-ceiling: stick");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map