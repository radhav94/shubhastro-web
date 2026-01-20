// export const getVideoEmbedConfig = (url) => {
//   if (!url || typeof url !== "string") {
//     return { type: "unsupported" };
//   }

//   const cleanUrl = url.trim();
//   const lowerUrl = cleanUrl.toLowerCase();

//   /* -------------------- YOUTUBE (ALL VARIANTS) -------------------- */
//   const youtubeRegex =
//     /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/;

//   const ytMatch = cleanUrl.match(youtubeRegex);

//   if (ytMatch) {
//     return {
//       type: "youtube",
//       src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&rel=0&playsinline=1&modestbranding=1`,
//       allow:
//         "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen",
//     };
//   }

//   /* -------------------- DIRECT VIDEO FILES -------------------- */
//   if (
//     lowerUrl.endsWith(".mp4") ||
//     lowerUrl.endsWith(".m3u8") ||
//     lowerUrl.endsWith(".webm")
//   ) {
//     return {
//       type: "video",
//       src: cleanUrl,
//     };
//   }

//   /* -------------------- KNOWN IFRAME-BLOCKED DOMAINS -------------------- */
//   const blockedIframeDomains = [
//     "somnath.org",
//     "sai.org.in",
//     "shreekamakshisaunsthan.org",
//     "temple360.in",
//     "angelcam.com",
//     "web-cast",
//   ];

//   if (blockedIframeDomains.some((domain) => lowerUrl.includes(domain))) {
//     return {
//       type: "external",
//       src: cleanUrl,
//     };
//   }

//   /* -------------------- DEFAULT IFRAME (BEST EFFORT) -------------------- */
//   return {
//     type: "iframe",
//     src: cleanUrl,
//     allow: "autoplay; fullscreen; picture-in-picture",
//   };
// };

export const getVideoEmbedConfig = (url) => {
  if (!url) return { type: "unsupported" };

  const cleanUrl = url.trim();

  const youtubeRegex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/;

  const ytMatch = cleanUrl.match(youtubeRegex);
  if (ytMatch) {
    return {
      type: "youtube",
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`,
      allow: "autoplay; encrypted-media; fullscreen",
    };
  }

  if (cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".m3u8")) {
    return { type: "video", src: cleanUrl };
  }

  // Expanded blocked domains list
  const blockedIframeDomains = [
    "shreekamakshisaunsthan.org",
    "sai.org.in",
    "somnath.org",
    // "temple360.in",
    "dwarkadhish.org",
    "shrituljabhavani.org",
  ];

  if (blockedIframeDomains.some((d) => cleanUrl.includes(d))) {
    return { type: "external", src: cleanUrl };
  }

  return { type: "iframe", src: cleanUrl };
};
