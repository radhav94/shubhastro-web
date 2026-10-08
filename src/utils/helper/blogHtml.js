/*
  Word-pasted blog bodies fake their bullets: each item starts with a span in
  font-family Symbol (or Wingdings) holding "·" (or "§"), the glyph only those
  symbol fonts draw as a bullet. Windows has the fonts, macOS and phones mostly
  do not — and the blog body is now forced onto Poppins so it looks the same
  everywhere — so the bullet came out as a tiny middle dot or a stray letter.
  Swap those characters for real Unicode bullets that every font draws.
*/
const SYMBOL_FONT = /font-family\s*:\s*["']?(symbol|wingdings)/i;
const BULLET_MAP = {
  "·": "•", // Symbol bullet
  "§": "▪", // Wingdings square
  "Ø": "➢", // Wingdings arrow
  "ü": "✓", // Wingdings tick
};

export const normalizeWordBullets = (html) => {
  if (!html || typeof window === "undefined" || !window.DOMParser) return html;
  if (!/symbol|wingdings/i.test(html)) return html;

  const doc = new window.DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  doc.querySelectorAll("[style]").forEach((el) => {
    if (!SYMBOL_FONT.test(el.getAttribute("style") || "")) return;
    const textNode = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
    const char = textNode?.nodeValue.trim();
    if (!char || !BULLET_MAP[char]) return;
    textNode.nodeValue = textNode.nodeValue.replace(char, BULLET_MAP[char]);
    // The symbol font is what made the old glyph a bullet; drop it, and Word's
    // hanging indent with it. Marked so the stylesheet can lay it out.
    el.style.fontFamily = "";
    el.style.textIndent = "";
    el.setAttribute("data-word-bullet", "");
  });
  return doc.body.innerHTML;
};
