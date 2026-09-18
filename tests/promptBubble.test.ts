// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { bubbleOf, contentOf, textOf } from "../src/client/promptBubble.ts";

/**
 * Build one prompt row in the shape the current Harness renders:
 * a flow item owning a keyed row, the message stack, and the actions chrome
 * the transcript appends last.
 */
function promptRow({
  prompt = "hello",
  marker,
  attachments = false,
  referenceSummary = false,
  buttons = 1,
  nestedAction = false,
}: {
  prompt?: string;
  marker?: string;
  attachments?: boolean;
  referenceSummary?: boolean;
  buttons?: number;
  nestedAction?: boolean;
} = {}): HTMLElement {
  document.body.innerHTML = "";
  const row = document.createElement("div");
  row.setAttribute("data-chat-flow-kind", "user");
  row.setAttribute("data-chat-anchor-key", "13:input-message1");

  const slot = document.createElement("div");
  slot.setAttribute("data-slot", "conversation.chat.node");
  const userRow = document.createElement("div");
  userRow.className = "userRow";
  if (marker !== undefined) userRow.setAttribute(marker, "");
  const stack = document.createElement("div");
  stack.className = "userStack";

  if (attachments) {
    const attachmentRow = document.createElement("div");
    attachmentRow.setAttribute("data-message-attachments", "");
    attachmentRow.textContent = "png 12 KB shot.png";
    stack.append(attachmentRow);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = prompt;
  stack.append(bubble);
  if (referenceSummary) {
    const summary = document.createElement("div");
    summary.textContent = "Referenced 1 file";
    stack.append(summary);
  }

  const actions = document.createElement("div");
  actions.className = "actions";
  const clock = document.createElement("span");
  clock.textContent = "14:32";
  actions.append(clock);
  for (let index = 0; index < buttons; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "copy");
    actions.append(button);
  }
  if (nestedAction) {
    const extra = document.createElement("div");
    const extraButton = document.createElement("button");
    extraButton.type = "button";
    extra.append(extraButton);
    actions.append(extra);
  }

  userRow.append(stack, actions);
  slot.append(userRow);
  row.append(slot);
  document.body.append(row);
  return row;
}

describe("textOf", () => {
  it("reads the prompt from a row with no marker attribute", () => {
    const row = promptRow({ prompt: "现在吸顶的样式有点难看" });
    expect(textOf(row)).toBe("现在吸顶的样式有点难看");
  });

  it("flattens original line breaks", () => {
    const row = promptRow({ prompt: "first\n  second" });
    expect(textOf(row)).toBe("first second");
  });

  it("ignores the clock and the copy button in the actions chrome", () => {
    const row = promptRow({ prompt: "hello" });
    expect(textOf(row)).not.toContain("14:32");
  });

  it("still reads a row carrying an older marker attribute", () => {
    const row = promptRow({ prompt: "hello", marker: "data-time-hover-root" });
    expect(textOf(row)).toBe("hello");
  });

  it("prefers the bubble over an attachment row and a reference summary", () => {
    const row = promptRow({ prompt: "the prompt", attachments: true, referenceSummary: true });
    expect(textOf(row)).toBe("the prompt");
  });

  it("ignores a nested plugin action button", () => {
    const row = promptRow({ prompt: "the prompt", nestedAction: true });
    expect(textOf(row)).toBe("the prompt");
  });

  it("still recovers the prompt when the row carries no actions chrome", () => {
    // Defensive path: it only runs if Harness stops rendering the controls that
    // anchor the lookup. Without that anchor nothing separates the prompt from
    // the clock, so the fallback only promises the prompt is still present.
    const row = promptRow({ prompt: "the prompt", buttons: 0 });
    expect(textOf(row)).toContain("the prompt");
  });
});

describe("contentOf and bubbleOf", () => {
  it("returns the message stack, not the actions chrome", () => {
    const row = promptRow({ prompt: "hello" });
    expect(contentOf(row).className).toBe("userStack");
    expect(contentOf(row).querySelector("button")).toBeNull();
  });

  it("returns the bubble itself, so the pinned bar morphs from it", () => {
    const row = promptRow({ prompt: "hello", attachments: true, referenceSummary: true });
    expect(bubbleOf(row).className).toBe("bubble");
  });
});
