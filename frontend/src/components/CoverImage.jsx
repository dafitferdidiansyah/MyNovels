import React, { useState, useEffect } from 'react';

const FALLBACK_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect width="200" height="300" fill="#18181b"/>
    <rect x="15" y="15" width="170" height="270" rx="6" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>
    <text x="100" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#a1a1aa" text-anchor="middle">NO COVER</text>
    <text x="100" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#71717a" text-anchor="middle">EPUB NOVEL</text>
  </svg>
`);

export default function CoverImage({ src, alt, className, style, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_SVG);

  useEffect(() => {
    setImgSrc(src || FALLBACK_SVG);
  }, [src]);

  return (
    <img
      src={imgSrc || FALLBACK_SVG}
      alt={alt || 'Cover'}
      className={className}
      style={style}
      onError={() => {
        if (imgSrc !== FALLBACK_SVG) {
          setImgSrc(FALLBACK_SVG);
        }
      }}
      {...props}
    />
  );
}
