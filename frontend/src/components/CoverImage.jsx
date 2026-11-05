import React, { useState } from 'react';

const FALLBACK_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
    <rect width="200" height="300" fill="#f1f3f5"/>
    <rect x="20" y="20" width="160" height="260" rx="4" fill="#e9ecef" stroke="#dee2e6" stroke-width="2"/>
    <text x="100" y="140" font-family="Poppins, sans-serif" font-size="13" font-weight="600" fill="#6c757d" text-anchor="middle">No Cover</text>
    <text x="100" y="160" font-family="Poppins, sans-serif" font-size="10" fill="#adb5bd" text-anchor="middle">ePub Novel</text>
  </svg>
`);

export default function CoverImage({ src, alt, className, style, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_SVG);

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
