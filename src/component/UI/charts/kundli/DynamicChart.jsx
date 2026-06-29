import styles from "./DynamicChart.module.scss";
import { motion } from "framer-motion";

const updateSvgFontSize = (dataUri, newSize = 12) => {
  if (!dataUri.startsWith("data:image/svg+xml")) return dataUri;

  const svgText = decodeURIComponent(dataUri.split(",")[1]);

  const updatedSvg = svgText.replace(
    /font-size:\s*\d+(\.\d+)?px/g,
    `font-size:${newSize}px`
  );

  return `data:image/svg+xml;utf8,${encodeURIComponent(updatedSvg)}`;
};

// Width estimate for a label at a given font size. Uses per-character widths so
// digits, parentheses and the retrograde "(R)" marker are counted accurately.
const estimateTextWidth = (text, fontSize) => {
  if (!text) return 0;
  let units = 0;
  for (const ch of text) {
    if (ch === "(" || ch === ")" || ch === "." || ch === " ") units += 0.32;
    else if (/[0-9]/.test(ch)) units += 0.55;
    else if (/[A-Z]/.test(ch)) units += 0.72;
    else units += 0.58; // lowercase / other
  }
  return units * fontSize;
};

/**
 * Some charts (e.g. the KP "Bhav Chalit" chart) are returned by the backend
 * without planet degrees, while the main chart shows them as a superscript next
 * to the planet abbreviation. When a `degreeMap` ({ planetAbbr: degree }) is
 * supplied we inject the missing degree as a superscript tspan so the KP chart
 * matches the rest of the kundli charts.
 */
const injectPlanetDegrees = (dataUri, degreeMap, fontSize = 8) => {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return dataUri;
  if (!dataUri.startsWith("data:image/svg+xml")) return dataUri;
  if (!degreeMap || Object.keys(degreeMap).length === 0) return dataUri;

  try {
    const svgText = decodeURIComponent(dataUri.split(",")[1]);
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return dataUri;

    const planets = Array.from(svg.querySelectorAll("text")).filter((t) =>
      /font-weight\s*:\s*bold/i.test(t.getAttribute("style") || "")
    );

    let changed = false;
    planets.forEach((node) => {
      // Skip if a degree superscript already exists.
      const hasDegree = Array.from(node.querySelectorAll("tspan")).some((ts) =>
        /baseline-shift\s*:\s*super/i.test(ts.getAttribute("style") || "")
      );
      if (hasDegree) return;
      // Skip if the label already shows a degree inline (e.g. South charts).
      if (/\d/.test(node.textContent || "")) return;

      // Base label is the first text node (e.g. "Su" for "Su(R)").
      const firstText = node.firstChild && node.firstChild.nodeType === 3
        ? node.firstChild.nodeValue.trim()
        : (node.textContent || "").replace(/\(R\)/g, "").trim();
      if (!firstText) return;

      const degree = degreeMap[firstText];
      if (degree === undefined || degree === null) return;

      const tspan = doc.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute(
        "style",
        `font-size:${Math.round(fontSize * 0.75 * 10) / 10}px;baseline-shift:super;font-weight:300;letter-spacing:-0.5px`
      );
      tspan.textContent = String(degree);
      node.appendChild(tspan);
      changed = true;
    });

    if (!changed) return dataUri;

    const serialized = new XMLSerializer().serializeToString(svg);
    return `data:image/svg+xml;utf8,${encodeURIComponent(serialized)}`;
  } catch {
    return dataUri;
  }
};

const PLANET_RE = /^(As|Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)(\(R\))?\d*$/;

/**
 * Backend-generated kundli SVGs place multiple planets in the same house at
 * fixed, closely-spaced x positions. When a label is wide (e.g. "Ju(R)") it
 * overlaps the next planet, or sits partly outside the chart. This re-spaces
 * planet labels that share a row and shifts clusters back inside the chart.
 *
 * Handles both North (bold labels) and South (non-bold labels, matched by a
 * planet name pattern) charts. Each cluster is laid out left-to-right with a
 * small gap and shifted as a single block so it never overlaps or clips.
 */
const fixOverlappingPlanets = (dataUri, fontSize = 8) => {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return dataUri;
  if (!dataUri.startsWith("data:image/svg+xml")) return dataUri;

  try {
    const svgText = decodeURIComponent(dataUri.split(",")[1]);
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return dataUri;

    const svgWidth = parseFloat(svg.getAttribute("width")) || 300;
    const LIMIT_L = 2;
    const LIMIT_R = svgWidth - 2;
    const GAP = 2;
    const CLUSTER_GAP = 60; // planets farther apart than this are different houses

    // Planet labels: bold (North) OR text matching a planet pattern (South).
    const planets = Array.from(svg.querySelectorAll("text")).filter((t) => {
      const style = t.getAttribute("style") || "";
      const txt = (t.textContent || "").replace(/\s+/g, "");
      return /font-weight\s*:\s*bold/i.test(style) || PLANET_RE.test(txt);
    });
    if (planets.length < 1) return dataUri;

    const anchorOf = (n) => {
      const style = n.getAttribute("style") || "";
      const m = style.match(/text-anchor\s*:\s*([a-z]+)/i);
      const a = (m && m[1]) || n.getAttribute("text-anchor") || "start";
      return a.toLowerCase();
    };
    const xOf = (n) => parseFloat(n.getAttribute("x")) || 0;
    const leftOf = (n, w) => {
      const a = anchorOf(n);
      if (a === "middle") return xOf(n) - w / 2;
      if (a === "end") return xOf(n) - w;
      return xOf(n);
    };

    // Group by rounded y (same visual row).
    const groups = new Map();
    planets.forEach((t) => {
      const y = Math.round(parseFloat(t.getAttribute("y")) || 0);
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push(t);
    });

    let changed = false;

    groups.forEach((rowNodes) => {
      rowNodes.sort((a, b) => xOf(a) - xOf(b));

      // Split the row into clusters of nearby planets (same house/box).
      const clusters = [];
      let current = [rowNodes[0]];
      for (let i = 1; i < rowNodes.length; i++) {
        if (xOf(rowNodes[i]) - xOf(rowNodes[i - 1]) <= CLUSTER_GAP) {
          current.push(rowNodes[i]);
        } else {
          clusters.push(current);
          current = [rowNodes[i]];
        }
      }
      clusters.push(current);

      clusters.forEach((nodes) => {
        const widths = nodes.map((n) => estimateTextWidth(n.textContent, fontSize));

        // Single label: just clamp inside the chart.
        if (nodes.length === 1) {
          const n = nodes[0];
          const w = widths[0];
          const left = leftOf(n, w);
          let shift = 0;
          if (left + w > LIMIT_R) shift = LIMIT_R - (left + w);
          if (left + shift < LIMIT_L) shift = LIMIT_L - left;
          if (Math.abs(shift) > 0.5) {
            n.setAttribute("x", String(Math.round((xOf(n) + shift) * 100) / 100));
            changed = true;
          }
          return;
        }

        // Multi-node cluster: relayout if labels overlap or sit out of bounds.
        let overlaps = false;
        for (let i = 0; i < nodes.length - 1; i++) {
          if (leftOf(nodes[i], widths[i]) + widths[i] + GAP > leftOf(nodes[i + 1], widths[i + 1])) {
            overlaps = true;
            break;
          }
        }
        const oob = nodes.some((n, i) => {
          const l = leftOf(n, widths[i]);
          return l < LIMIT_L - 0.5 || l + widths[i] > LIMIT_R + 0.5;
        });
        if (!overlaps && !oob) return;

        const xs = nodes.map((n) => xOf(n));
        const center = (Math.min(...xs) + Math.max(...xs)) / 2;
        const total = widths.reduce((s, w) => s + w, 0) + GAP * (nodes.length - 1);
        let start = center - total / 2;
        if (start < LIMIT_L) start = LIMIT_L;
        if (start + total > LIMIT_R) start = LIMIT_R - total;

        let cursor = start;
        nodes.forEach((n, i) => {
          n.setAttribute("x", String(Math.round(cursor * 100) / 100));
          n.setAttribute("text-anchor", "start");
          cursor += widths[i] + GAP;
        });
        changed = true;
      });
    });

    if (!changed) return dataUri;

    const serialized = new XMLSerializer().serializeToString(svg);
    return `data:image/svg+xml;utf8,${encodeURIComponent(serialized)}`;
  } catch {
    return dataUri;
  }
};

const sectionVariants = {
  hidden: { opacity: 0.6, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const DynamicChart = ({ title, src, fontSize = 8, degreeMap }) => {
  if (!src) return null;

  const withDegrees = injectPlanetDegrees(
    updateSvgFontSize(src, fontSize),
    degreeMap,
    fontSize
  );
  const updatedSrc = fixOverlappingPlanets(withDegrees, fontSize);

  return (
    <motion.div
      className={styles.contentCard}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {title && <h3 className={styles.cardTitle}>{title}</h3>}

      <div className={styles.chartPlaceholder}>
        <img
          src={updatedSrc}
          alt={title || "Chart"}
          className={styles.chartImage}
        />
      </div>
    </motion.div>
  );
};

export default DynamicChart;
