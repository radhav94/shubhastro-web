/**
 * Utility functions for link preview functionality
 */

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Detect if text contains a URL
 * @param {string} text - Text to check
 * @returns {string|null} - First URL found or null
 */
export const detectURL = (text) => {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
};

/**
 * Check if URL is an image
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export const isImageURL = (url) => {
  if (!url) return false;
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
  return imageExtensions.test(url);
};

/**
 * Fetch Open Graph metadata from URL
 * @param {string} url - URL to fetch metadata from
 * @returns {Promise<Object>} - Metadata object
 */
export const fetchLinkPreview = async (url) => {
  try {
    // For now, we'll use a simple approach
    // In production, you'd want to use a backend service or API
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch');
    }

    const html = await response.text();
    
    // Extract Open Graph tags
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
    const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
    
    // Fallback to regular meta tags
    const title = ogTitle || html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = ogDescription || html.match(/<meta name="description" content="([^"]+)"/)?.[1];

    return {
      url,
      image: ogImage,
      title: title || url,
      description: description || '',
    };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return {
      url,
      image: null,
      title: url,
      description: '',
    };
  }
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Domain name
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

/**
 * Matches Markdown-style links so we can render the *label* as the clickable
 * text and point it at the real URL — instead of dumping the raw
 * `[label](url)` syntax on screen.
 *
 * Handles three shapes, all of which turn up in AI/CMS content:
 *
 *   1. Well-formed:            `[label](https://x.com/p)`
 *   2. Escaped parens:         `[label]\(https://x.com/p\)`  (LLMs often escape)
 *   3. Malformed / nested:     `[label]\([label-is-a-link](url))`
 *      — the label text itself is a second Markdown link and the whole thing is
 *      wrapped in an extra pair of parens. This is the "Business Pathfinder"
 *      case: it read as `Our [Business Pathfinder]\([URL](URL))`.
 *
 * A note on how those examples are written. Tailwind's content scanner reads
 * this file as raw text (`content: ["./src/**\/*.{js,ts,jsx,tsx}"]` in
 * tailwind.config.js) — it does not parse JavaScript, so it sees comments too.
 * A bracketed URL like `[https:` + `//…]` matches Tailwind's arbitrary-property
 * syntax — an opening bracket, a property name, a colon, a value, a closing
 * bracket, no spaces — so it emitted a real rule into the bundle:
 *
 *     .\[https\:\/\/\2026\] { https: //…; }
 *
 * which is not valid CSS. esbuild then warned on every build
 * (`js-comment-in-css`, "Comments in CSS use /* ... *\/ instead of //") because
 * it read the `//` as a comment. Harmless at runtime, but it is dead CSS and a
 * permanent build warning. Placeholders without a `:` cannot be mistaken for an
 * arbitrary property, so the examples above use `url` and `URL`.
 *
 * The label is captured non-greedily and the URL group only accepts a real
 * `http(s)://…` target so ordinary bracketed prose like `[note] (see below)` is
 * left untouched. A trailing `)` (from the malformed wrapper) is tolerated and
 * dropped.
 */
const MARKDOWN_LINK_REGEX =
  /\[([^\][]+?)\]\\?\(\s*(?:\[[^\][]*?\]\\?\()?\s*(https?:\/\/[^\s()\\]+)[^)]*\)?\s*\)?/g;

/**
 * Markdown links that point at an *internal* app route rather than an absolute
 * URL — `[label](/kundli)`, `[Palmistry](/ai-wow/ai-palmistry-scanner)`, etc.
 *
 * MARKDOWN_LINK_REGEX deliberately only matches an `http(s)://` target, so
 * every one of these fell through to plain text. That is a dead click: Pandit AI
 * routinely recommends a feature and links it with a site-relative path, and in
 * Hindi replies especially ("aap [कुंडली](/kundli) ka use karein…") the label
 * reads as the obvious thing to tap. Clarity session gx75h1 recorded exactly
 * that — a dead click on the reply text right before "ka use karein. Aapke
 * part…", which is the tail of a sentence wrapped around one of these links.
 *
 * The target must start with a single `/` (a real in-app path) and must NOT be
 * `//` (protocol-relative, i.e. off-site) so ordinary prose like `[a](b)` or a
 * bare `[note](see below)` is left untouched. Escaped parens and the malformed
 * double-wrap the model sometimes emits are tolerated the same way the absolute
 * pattern tolerates them.
 */
const INTERNAL_MARKDOWN_LINK_REGEX =
  /\[([^\][]+?)\]\\?\(\s*(\/(?!\/)[^\s()\\]*)\s*\)?/g;

/**
 * Strips any leftover Markdown link markup from a label so the visible text is
 * clean — e.g. a label that is itself `[https://x.com](https://x.com)` collapses
 * to just the inner text.
 * @param {string} label
 * @returns {string}
 */
const cleanLinkLabel = (label) => {
  if (!label) return label;
  const inner = label.match(/^\s*\[([^\][]+?)\]\\?\(.*\)\s*$/);
  return (inner ? inner[1] : label).trim();
};

/**
 * Splits text into plain, URL, and Markdown-link segments so a renderer can turn
 * links into real anchors *in place*.
 *
 * Two kinds of links are recognised, in priority order:
 *
 *   1. Markdown links — `[label](url)` and its escaped / malformed variants —
 *      which render with `label` as the visible, clickable text.
 *   2. Bare URLs — `https://…` — which render with the URL itself as the text.
 *
 * Chat bubbles used to render the message text verbatim, so a URL either
 * appeared twice (once inert in the sentence, once in a preview) or, for
 * Markdown links, showed the raw `[label](url)` syntax. Both are now proper
 * clickable anchors carrying the original label and target.
 *
 * Every URL part exposes `value` (the text to display) and `href` (the target)
 * separately, so a Markdown link shows its label while a bare URL shows the URL.
 * Trailing punctuation is trimmed off bare-URL hrefs because the regex is greedy
 * up to whitespace, so "see https://x.com/a." would otherwise link to a 404.
 *
 * `type: 'internal'` parts are Markdown links to an in-app route (`href` is a
 * site-relative path like `/kundli`); the renderer should navigate with the
 * router rather than opening a new tab. Consumers that don't special-case it can
 * treat it like plain text — the `value` (label) still reads correctly.
 *
 * @param {string} text
 * @returns {Array<{ type: 'text'|'url'|'internal', value: string, href?: string }>}
 */
export const splitTextByURL = (text) => {
  if (!text || typeof text !== 'string') return [];

  // Pass 1: pull out Markdown links, keeping the surrounding text as segments to
  // be scanned for bare URLs in pass 2. Fresh regex per call — the shared global
  // patterns carry lastIndex across calls and would drop matches at random.
  const mdPattern = new RegExp(MARKDOWN_LINK_REGEX.source, 'g');
  const segments = [];
  let cursor = 0;
  let mdMatch;

  while ((mdMatch = mdPattern.exec(text)) !== null) {
    if (mdMatch.index > cursor) {
      segments.push({ kind: 'scan', value: text.slice(cursor, mdMatch.index) });
    }
    const label = cleanLinkLabel(mdMatch[1]) || mdMatch[2];
    segments.push({ kind: 'link', value: label, href: mdMatch[2] });
    cursor = mdPattern.lastIndex;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'scan', value: text.slice(cursor) });
  }

  // Pass 1b: within the leftover `scan` segments, pull out Markdown links that
  // point at an internal app route (`[label](/path)`). Done after the absolute
  // pass so an `http(s)://` link is never re-interpreted as internal, and only
  // over `scan` segments so we never touch an already-resolved link's label.
  const internalPattern = new RegExp(INTERNAL_MARKDOWN_LINK_REGEX.source, 'g');
  const expandedSegments = [];

  segments.forEach((segment) => {
    if (segment.kind !== 'scan') {
      expandedSegments.push(segment);
      return;
    }
    const chunk = segment.value;
    internalPattern.lastIndex = 0;
    let subCursor = 0;
    let intMatch;
    while ((intMatch = internalPattern.exec(chunk)) !== null) {
      if (intMatch.index > subCursor) {
        expandedSegments.push({ kind: 'scan', value: chunk.slice(subCursor, intMatch.index) });
      }
      const label = cleanLinkLabel(intMatch[1]) || intMatch[2];
      expandedSegments.push({ kind: 'internal', value: label, href: intMatch[2] });
      subCursor = internalPattern.lastIndex;
    }
    if (subCursor < chunk.length) {
      expandedSegments.push({ kind: 'scan', value: chunk.slice(subCursor) });
    }
  });

  // Pass 2: expand the plain segments into text + bare-URL parts.
  const parts = [];
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  expandedSegments.forEach((segment) => {
    if (segment.kind === 'link') {
      parts.push({ type: 'url', value: segment.value, href: segment.href });
      return;
    }
    if (segment.kind === 'internal') {
      parts.push({ type: 'internal', value: segment.value, href: segment.href });
      return;
    }

    const chunk = segment.value;
    let lastIndex = 0;
    let match;
    urlPattern.lastIndex = 0;

    while ((match = urlPattern.exec(chunk)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: chunk.slice(lastIndex, match.index) });
      }

      const raw = match[0];
      const trailing = raw.match(/[.,;:!?)\]}'"]+$/)?.[0] || '';
      const href = trailing ? raw.slice(0, -trailing.length) : raw;

      parts.push({ type: 'url', value: href, href });
      if (trailing) parts.push({ type: 'text', value: trailing });

      lastIndex = urlPattern.lastIndex;
    }

    if (lastIndex < chunk.length) {
      parts.push({ type: 'text', value: chunk.slice(lastIndex) });
    }
  });

  // Guarantee a space between a link and any word-character text glued directly
  // to it. Malformed Markdown from the model sometimes closes with no separator
  // (`…business-pathfinder))maps your`), which would otherwise render as
  // "Business Pathfindermaps". Insert the space the reader expects rather than
  // trusting the source to have one.
  const isLinkPart = (p) => p.type === 'url' || p.type === 'internal';
  for (let i = 0; i < parts.length - 1; i += 1) {
    const current = parts[i];
    const next = parts[i + 1];
    if (isLinkPart(current) && next.type === 'text' && /^\w/.test(next.value)) {
      next.value = ` ${next.value}`;
    }
    if (isLinkPart(next) && current.type === 'text' && /\w$/.test(current.value)) {
      current.value = `${current.value} `;
    }
  }

  return parts;
};

/**
 * Turns bare URLs inside an HTML string into real links, leaving existing
 * anchors alone.
 *
 * CMS-authored article bodies routinely end with something like
 * `Visit&nbsp;<font><span>https://www.shubhastro.ai/</span></font>` — a URL that
 * reads as a link and is plain text. Readers click it and nothing happens.
 *
 * Parsed through DOMParser rather than regex-replaced: the body is full of
 * `href`/`src` attributes and nested inline styles, and a regex over raw HTML
 * would happily rewrite the inside of an attribute. `parseFromString` does not
 * execute scripts, so this is a structural pass only.
 *
 * @param {string} html
 * @returns {string} the same HTML with bare URLs wrapped in anchors
 */
const SKIP_LINKIFY_TAGS = new Set(['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);

export const linkifyHtml = (html) => {
  if (!html || typeof html !== 'string') return html;
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return html;
  if (!/https?:\/\//i.test(html)) return html;

  try {
    const doc = new window.DOMParser().parseFromString(html, 'text/html');
    const walker = doc.createTreeWalker(doc.body, window.NodeFilter.SHOW_TEXT);

    // Collect first, mutate after: replacing nodes while walking invalidates the
    // walker's position.
    const targets = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue || !/https?:\/\//i.test(node.nodeValue)) continue;

      let skip = false;
      for (let el = node.parentElement; el && el !== doc.body; el = el.parentElement) {
        if (SKIP_LINKIFY_TAGS.has(el.tagName)) {
          skip = true;
          break;
        }
      }
      if (!skip) targets.push(node);
    }

    targets.forEach((node) => {
      const parts = splitTextByURL(node.nodeValue);
      if (!parts.some((part) => part.type === 'url')) return;

      const fragment = doc.createDocumentFragment();
      parts.forEach((part) => {
        if (part.type === 'url') {
          const anchor = doc.createElement('a');
          anchor.setAttribute('href', part.href);
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
          anchor.textContent = part.value;
          fragment.appendChild(anchor);
        } else {
          fragment.appendChild(doc.createTextNode(part.value));
        }
      });

      node.parentNode?.replaceChild(fragment, node);
    });

    return doc.body.innerHTML;
  } catch (error) {
    console.error('linkifyHtml failed, using original body:', error);
    return html;
  }
};
