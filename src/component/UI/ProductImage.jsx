import { useState, useEffect } from "react";
import { DefaultImages } from "../../utils/appImages";

const DEFAULT_IMG = DefaultImages.AstromallProductDefault;

/**
 * Product image with pre-validation.
 * Checks if `src` actually loads; shows default if broken / null / empty.
 */
const ProductImage = ({ src, alt = "Product", className, style, onClick }) => {
  const [imgSrc, setImgSrc] = useState(null); // null = still checking

  useEffect(() => {
    if (!src) { setImgSrc(DEFAULT_IMG); return; }
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setImgSrc(src); };
    img.onerror = () => { if (!cancelled) setImgSrc(DEFAULT_IMG); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);

  return (
    <img
      src={imgSrc || DEFAULT_IMG}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
    />
  );
};

export default ProductImage;
