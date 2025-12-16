export function sanitizeSvg(raw = "") {
  if (!raw) return "";

  let svg = raw;

  // Remove wrapping quotes
  if (
    (svg.startsWith('"') && svg.endsWith('"')) ||
    (svg.startsWith("'") && svg.endsWith("'"))
  ) {
    svg = svg.slice(1, -1);
  }

  // Fix escaped quotes FIRST (very important)
  svg = svg.replace(/\\+"/g, '"');

  // Decode HTML entities (&quot;, &lt;, &gt;, &amp;)
  const textarea = document.createElement("textarea");
  textarea.innerHTML = svg;
  svg = textarea.value;

  // Remove XML / DOCTYPE / comments
  svg = svg
    .replace(/<\?xml.*?\?>/gi, "")
    .replace(/<!DOCTYPE.*?>/gi, "")
    .replace(/<!--.*?-->/gs, "");

  // Remove newlines & extra spaces
  svg = svg
    .replace(/\r?\n|\r/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Extract SVG element
  svg = svg.match(/<svg[\s\S]*<\/svg>/i)?.[0] || "";

  if (!svg) return "";

  // Encode the SVG for data URL
  const encodedSvg = encodeURIComponent(svg);
  return `data:image/svg+xml;utf8,${encodedSvg}`;
}