export function sanitizeSvg(raw = "") {
  if (!raw) return "";

  let svg = raw;

  //  Remove wrapping quotes
  if (
    (svg.startsWith('"') && svg.endsWith('"')) ||
    (svg.startsWith("'") && svg.endsWith("'"))
  ) {
    svg = svg.slice(1, -1);
  }

  //  Fix escaped quotes FIRST (very important)
  svg = svg.replace(/\\+"/g, '"');

  //  Decode HTML entities (&quot;, &lt;, &gt;, &amp;)
  const textarea = document.createElement("textarea");
  textarea.innerHTML = svg;
  svg = textarea.value;

  //  Remove XML / DOCTYPE / comments
  svg = svg
    .replace(/<\?xml.*?\?>/gi, "")
    .replace(/<!DOCTYPE.*?>/gi, "")
    .replace(/<!--.*?-->/gs, "");

  //  NOW remove newlines & extra spaces (LAST step)
  svg = svg
    .replace(/\r?\n|\r/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

    svg = svg.match(/<svg[\s\S]*<\/svg>/i)?.[0] || "";



  return svg;
}
