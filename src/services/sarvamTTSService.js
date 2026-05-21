const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY;
const TTS_API_URL = "/api/sarvam/text-to-speech";
const STT_API_URL = "/api/sarvam/speech-to-text";

export const SARVAM_SPEAKERS = {
  SHUBH: "shubh",
  ANUSHKA: "anushka",
  ISHITA: "ishita"
};

export const SARVAM_LANGUAGES = {
  HINDI: "hi-IN",
  ENGLISH: "en-IN",
  BENGALI: "bn-IN",
  TAMIL: "ta-IN",
  TELUGU: "te-IN",
  KANNADA: "kn-IN",
  MALAYALAM: "ml-IN",
  MARATHI: "mr-IN",
  GUJARATI: "gu-IN",
  PUNJABI: "pa-IN",
  ODIA: "or-IN",
};

/**
 * Convert text to speech using Sarvam AI
 * @param {string} text - Text to convert
 * @param {object} options - TTS options
 * @param {AbortSignal} [options.signal] - AbortController signal
 * @returns {Promise<string>} Base64 encoded audio
 */
export const textToSpeech = async (text, options = {}) => {
  const {
    language = SARVAM_LANGUAGES.HINDI,
    speaker = SARVAM_SPEAKERS.ISHITA,
    pace = 1.0,
    model = "bulbul:v3",
    signal,
  } = options;

  const response = await fetch(TTS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      model,
      text,
      target_language_code: language,
      speaker,
      pace,
      enable_preprocessing: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Sarvam TTS failed: ${response.status}`);
  }

  const data = await response.json();
  return data.audios[0];
};

/**
 * Convert speech to text using Sarvam AI
 * @param {Blob} audioBlob - Audio blob (wav/webm)
 * @param {object} options - STT options
 * @param {string} [options.model] - Model to use (default: saaras:v2)
 * @param {string} [options.mode] - Mode: transcribe | translate | verbatim | translit | codemix
 * @param {AbortSignal} [options.signal] - AbortController signal
 * @returns {Promise<{transcript: string, language_code: string}>}
 */
export const speechToText = async (audioBlob, options = {}) => {
  const {
    model = "saaras:v3",
    mode = "transcribe",
    signal,
  } = options;

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.wav");
  formData.append("model", model);
  formData.append("mode", mode);

  const response = await fetch(STT_API_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Sarvam STT failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    transcript: data.transcript || "",
    language_code: data.language_code ? data.language_code.split("-")[0] : "",
  };
};
