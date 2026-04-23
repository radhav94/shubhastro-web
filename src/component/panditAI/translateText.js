const GOOGLE_TRANSLATE_URL =
  "https://translate.googleapis.com/translate_a/single";

const parseTranslation = (data) => {
  if (!Array.isArray(data?.[0])) return "";

  return data[0]
    .map((chunk) => (Array.isArray(chunk) ? chunk[0] : ""))
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
