/**
 * Extracts a display name from an attachment message text.
 * Handles JSON payloads ({ url, fileName }) and plain URLs.
 * @param {string} text - The message text (URL or JSON string)
 * @returns {string} The file name to display
 */
export const getAttachmentDisplayName = (text) => {
  if (!text) return "Attachment";

  // Try JSON payload first
  try {
    const parsed = typeof text === "string" ? JSON.parse(text) : text;
    if (parsed?.fileName) return parsed.fileName;
    if (parsed?.url) {
      const last = new URL(parsed.url).pathname.split("/").pop();
      if (last?.includes(".")) return decodeURIComponent(last);
    }
  } catch {
    // Not JSON — try extracting from URL
    try {
      const last = new URL(text).pathname.split("/").pop();
      if (last?.includes(".")) return decodeURIComponent(last);
    } catch {
      // Not a valid URL either
    }
  }

  return "Attachment";
};
