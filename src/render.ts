// DOM-safe text rendering: content is never interpreted as HTML.
import type { JaText, LocalizedText } from "./types.js";

export type ReadingAid = "ruby" | "romaji" | "off";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function localized(lt: LocalizedText): string {
  return lt.en;
}

// Renders a jaText according to the reading-aid mode:
//  - ruby: <ruby>segment<rt>reading</rt></ruby> per segment with a reading;
//  - romaji: plain Japanese line plus a romaji line when available;
//  - off: plain Japanese text.
// The returned element always carries lang="ja".
export function renderJa(ja: JaText, mode: ReadingAid): HTMLElement {
  const wrap = el("span", "ja");
  wrap.lang = "ja";
  if (mode === "ruby") {
    for (const seg of ja.ruby) {
      if (seg.r) {
        const ruby = el("ruby");
        ruby.appendChild(document.createTextNode(seg.t));
        const rt = el("rt");
        rt.textContent = seg.r;
        ruby.appendChild(rt);
        wrap.appendChild(ruby);
      } else {
        wrap.appendChild(document.createTextNode(seg.t));
      }
    }
  } else {
    wrap.textContent = ja.text;
  }
  if (mode === "romaji" && ja.romaji) {
    const outer = el("span", "ja-with-romaji");
    outer.appendChild(wrap);
    const rom = el("span", "romaji", ja.romaji);
    rom.lang = "en";
    outer.appendChild(rom);
    return outer;
  }
  return wrap;
}

export function enText(text: string, className?: string): HTMLElement {
  const node = el("span", className, text);
  node.lang = "en";
  return node;
}
