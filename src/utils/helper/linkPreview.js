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
