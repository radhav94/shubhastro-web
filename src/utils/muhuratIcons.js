import abhijitIcon from "../assets/images/Abhijit-Muhurat 1.png";
import rahuKaalIcon from "../assets/images/Crucial Muhurats.png";
import gulikaIcon from "../assets/images/Gulika-icon 1.png";
import yamakantaIcon from "../assets/images/Crucial Muhurats (1).png";
import defaultSquareImg from "../assets/images/default_image_square_500x500.png";

export const MUHURAT_FALLBACK_ICON = defaultSquareImg;

/**
 * Muhurat icons, keyed by name rather than by list position.
 *
 * The homepage widget used to index a plain array (`MUHURAT_ICONS[i]`), which
 * silently mismatched icons the moment a muhurat was added, removed or
 * reordered. Keying on the name lets the panchang page reuse the same artwork
 * without having to replicate that ordering.
 *
 * Keys are lowercased on lookup, so "Rahu Kaal" / "rahu kaal" both resolve.
 */
const ICONS_BY_NAME = {
  "abhijit muhurat": abhijitIcon,
  "rahu kaal": rahuKaalIcon,
  "gulika kaal": gulikaIcon,
  "yamakanta kaal": yamakantaIcon,
};

/**
 * @param {string} name - muhurat title, e.g. "Rahu Kaal"
 * @returns {string} icon URL; a neutral square placeholder for unknown names,
 *   so a new muhurat from the API renders a box rather than a broken image.
 */
export function getMuhuratIcon(name) {
  if (!name) return defaultSquareImg;
  return ICONS_BY_NAME[String(name).trim().toLowerCase()] || defaultSquareImg;
}
