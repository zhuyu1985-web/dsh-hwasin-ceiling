/**
 * Locating the prompt bubble inside one user row.
 *
 * The transcript is Harness-private markup, not a plugin API. Two marker
 * attributes have already come and gone (`data-time-hover-root`, then
 * `data-actions-reveal`), so the marker list below is only a fast path for
 * builds that still have one: the durable anchor is the actions chrome, which
 * every prompt row appends and which no version has renamed.
 */

import { flattenPromptText } from "./flattenPrompt.ts";

/** Markers earlier Harness builds put on a prompt row's bubble wrapper. */
const BUBBLE_MARKERS = ["[data-time-hover-root]", "[data-actions-reveal]"] as const;

/** The attachment block a prompt row may render above its bubble. */
const ATTACHMENT_BLOCK = "[data-message-attachments]";

/**
 * Trailing actions chrome of one prompt row (clock plus copy/branch controls).
 * The row's last button lives inside it; a plugin-injected action may nest its
 * own button deeper, so climb while the parent still holds controls directly.
 */
function actionsChrome(row: HTMLElement): HTMLElement | null {
  const buttons = row.querySelectorAll("button");
  const last = buttons[buttons.length - 1];
  let chrome = last?.parentElement ?? null;
  while (chrome !== null
    && chrome.parentElement !== null
    && chrome.parentElement.querySelector(":scope > button") !== null) {
    chrome = chrome.parentElement;
  }
  return chrome;
}

/** Wrapper whose first element child is the row's message content, or null when the row does not match. */
function contentWrapper(row: HTMLElement, chrome: HTMLElement | null): HTMLElement | null {
  for (const marker of BUBBLE_MARKERS) {
    const marked = row.querySelector<HTMLElement>(marker);
    if (marked !== null) return marked;
  }
  const wrapper = chrome?.parentElement ?? null;
  if (wrapper === null || wrapper === row || !row.contains(wrapper)) return null;
  return wrapper;
}

/** Element holding a prompt row's message content; the actions chrome is never part of it. */
export function contentOf(row: HTMLElement): HTMLElement {
  const chrome = actionsChrome(row);
  const stack = contentWrapper(row, chrome)?.firstElementChild ?? null;
  if (stack instanceof HTMLElement
    && stack !== chrome
    && stack.querySelector("button") === null
    && (stack.textContent ?? "").trim() !== "") {
    return stack;
  }

  // Fallback for a row that does not match the expected structure: the richest
  // container that owns no button still holds the prompt.
  let best = row;
  let bestLength = -1;
  for (const element of [row, ...row.querySelectorAll<HTMLElement>("*")]) {
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
export function bubbleOf(row: HTMLElement): HTMLElement {
  const stack = contentOf(row);
  for (const child of stack.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.matches(ATTACHMENT_BLOCK) || child.querySelector(ATTACHMENT_BLOCK) !== null) continue;
    if ((child.textContent ?? "").trim() !== "") return child;
  }
  return stack;
}

/** Flattened prompt text the pinned bar shows for one row. */
export function textOf(row: HTMLElement): string {
  return flattenPromptText(bubbleOf(row).textContent ?? "");
}
