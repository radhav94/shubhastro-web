const GOOGLE_TRANSLATE_URL =
  "https://translate.googleapis.com/translate_a/single";

const parseTranslation = (data) => {
  if (!Array.isArray(data?.[0])) return "";

  return data[0]
    .map((chunk) => (Array.isArray(chunk) ? chunk[0] : ""))
    .join("")
    .trim();
};

const parseTransliteration = (data) => {
  // Romanization is in data[0][i][3] when dt=rm is requested
  if (!Array.isArray(data?.[0])) return "";

  return data[0]
    .map((chunk) => (Array.isArray(chunk) && chunk[3] ? chunk[3] : ""))
    .join("")
    .trim();
};

export const getLanguageCode = (language = "en-IN") =>
  language.split("-")[0] || "en";

export const translateText = async ({ text, targetLanguage }) => {
  const trimmedText = text.trim();
  const targetCode = getLanguageCode(targetLanguage);

  if (!trimmedText) return "";

  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetCode,
    dt: "t",
    q: trimmedText,
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to translate text");
  }

  const data = await response.json();
  return parseTranslation(data) || trimmedText;
};

/**
 * Transliterates non-Latin text to Latin/Roman script.
 * e.g., "मेरा भविष्य बताओ" → "mera bhavishya batao"
 */
export const transliterateToLatin = async (text) => {
  const trimmedText = text.trim();
  if (!trimmedText) return "";

  // If already Latin script, return as-is
  if (/^[\x00-\x7F\s]+$/.test(trimmedText)) return trimmedText;

  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: "en",
    dt: "rm",
    q: trimmedText,
  });

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);
    if (!response.ok) return trimmedText;

    const data = await response.json();
    const romanized = parseTransliteration(data);
    return romanized || trimmedText;
  } catch {
    return trimmedText;
  }
};
