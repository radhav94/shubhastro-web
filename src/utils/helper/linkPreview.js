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
 * Splits text into plain and URL segments so a renderer can turn the URLs into
 * real links *in place*.
 *
 * Chat bubbles used to render the message text verbatim and then append a
 * separate clickable preview below it. The URL therefore appeared twice, and the
 * copy inside the sentence — the one a reader actually clicks — was inert text.
 *
 * Trailing punctuation is trimmed off the href because the regex is greedy up to
 * whitespace, so "see https://x.com/a." would otherwise link to a 404.
 *
 * @param {string} text
 * @returns {Array<{ type: 'text'|'url', value: string, href?: string }>}
 */
export const splitTextByURL = (text) => {
  if (!text || typeof text !== 'string') return [];

  const parts = [];
  // A fresh regex per call: URL_REGEX is global and shared, so reusing it here
  // would carry lastIndex across calls and drop matches at random.
  const pattern = /(https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    const trailing = raw.match(/[.,;:!?)\]}'"]+$/)?.[0] || '';
    const href = trailing ? raw.slice(0, -trailing.length) : raw;

    parts.push({ type: 'url', value: href, href });
    if (trailing) parts.push({ type: 'text', value: trailing });

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
};
