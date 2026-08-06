// TEMPORARY verification script — deleted after running.
// Checks the new chart response pipeline against the REAL backend body in /tmp/chart.out
import fs from "node:fs";

const raw = fs.readFileSync("/tmp/chart.out", "utf8");

// --- what svgResponseHandler does ---
const svgResponseHandler = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
const toSvgString = (r) => (typeof r === "string" ? r : "");

// --- sanitizeSvg, logic copied from src/utils/helper/sanitizeSvg.js
// (the textarea entity-decode step replaced with a minimal node equivalent) ---
function sanitizeSvg(input = "") {
  if (!input) return "";
  let svg = input;
  if (
    (svg.startsWith('"') && svg.endsWith('"')) ||
    (svg.startsWith("'") && svg.endsWith("'"))
  ) {
    svg = svg.slice(1, -1);
  }
  svg = svg.replace(/\\+"/g, '"');
  svg = svg
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  svg = svg
    .replace(/<\?xml.*?\?>/gi, "")
    .replace(/<!DOCTYPE.*?>/gi, "")
    .replace(/<!--.*?-->/gs, "");
  svg = svg.replace(/\r?\n|\r/g, "").replace(/\s{2,}/g, " ").trim();
  svg = svg.match(/<svg[\s\S]*<\/svg>/i)?.[0] || "";
  if (!svg) return "";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const envelopeText = JSON.stringify({ enc: 1, iv: "abc", data: "Y2lwaGVydGV4dA==" });
const isEncryptedEnvelope = (v) =>
  Boolean(v && typeof v === "object" && v.enc === 1 && typeof v.iv === "string" && typeof v.data === "string");

console.log("=== A. direct-to-backend (no gateway) ===");
const parsed = svgResponseHandler(raw);
const newDirect = sanitizeSvg(toSvgString(parsed));
console.log("  parsed type        :", typeof parsed);
console.log("  chart src produced :", Boolean(newDirect), "(len " + newDirect.length + ")");

console.log("\n=== B. through gateway, OLD responseHandler:'text' ===");
console.log("  data type          : string");
console.log("  isEncryptedEnvelope:", isEncryptedEnvelope(envelopeText), "-> never decrypted");
const oldGateway = sanitizeSvg(envelopeText);
console.log("  chart src produced :", Boolean(oldGateway), "<-- BUG: every chart dropped");

console.log("\n=== C. through gateway, NEW svgResponseHandler ===");
const asObject = svgResponseHandler(envelopeText);
console.log("  data type          :", typeof asObject);
console.log("  isEncryptedEnvelope:", isEncryptedEnvelope(asObject), "-> decryptEnvelope runs");
// decryptEnvelope JSON.parses the plaintext, so transformResponse gets the SVG string:
const afterDecrypt = JSON.parse(raw);
const newGateway = sanitizeSvg(toSvgString(afterDecrypt));
console.log("  chart src produced :", Boolean(newGateway), "(len " + newGateway.length + ")");

console.log("\n=== D. upstream serving raw image/svg+xml (not JSON) ===");
const rawSvg = "<svg height=\"300\" width=\"300\"><rect/></svg>";
const fallback = svgResponseHandler(rawSvg);
const newRaw = sanitizeSvg(toSvgString(fallback));
console.log("  parsed type        :", typeof fallback, "(JSON.parse threw -> text)");
console.log("  chart src produced :", Boolean(newRaw));
