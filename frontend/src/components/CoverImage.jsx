import React, { useState, useEffect } from 'react';

function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSeed(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function renderArtEmblem(seed) {
  const variant = seed % 4;

  if (variant === 0) {
    return `
      <g transform="translate(100, 138)" stroke="#a1a1aa" fill="none">
        <circle r="46" stroke="#27272a" stroke-width="1.5"/>
        <circle r="40" stroke="#3f3f46" stroke-width="0.75" stroke-dasharray="3,3"/>
        <circle r="28" stroke="#71717a" stroke-width="1"/>
        <line x1="-50" y1="0" x2="50" y2="0" stroke="#3f3f46" stroke-width="0.75"/>
        <line x1="0" y1="-50" x2="0" y2="50" stroke="#3f3f46" stroke-width="0.75"/>
        <ellipse rx="42" ry="15" stroke="#a1a1aa" stroke-width="1" transform="rotate(-28)"/>
        <path d="M 0,-16 L 3,-4 L 16,0 L 3,4 L 0,16 L -3,4 L -16,0 L -3,-4 Z" fill="#f4f4f5" stroke="none"/>
        <polygon points="26,-22 28,-19 26,-16 24,-19" fill="#71717a" stroke="none"/>
        <polygon points="-26,22 -24,25 -26,28 -28,25" fill="#71717a" stroke="none"/>
      </g>
    `;
  }

  if (variant === 1) {
    return `
      <g transform="translate(100, 138)" stroke="#a1a1aa" fill="none">
        <polygon points="0,-50 42,0 0,50 -42,0" stroke="#27272a" stroke-width="1.2"/>
        <circle r="36" stroke="#3f3f46" stroke-width="0.75" stroke-dasharray="2,2"/>
        <polygon points="0,-38 10,-24 0,-10 -10,-24" stroke="#71717a" stroke-width="1" fill="#18181b"/>
        <path d="M -30,6 Q -15,0 0,6 Q 15,0 30,6 L 30,24 Q 15,17 0,23 Q -15,17 -30,24 Z" stroke="#e4e4e7" stroke-width="1.3" fill="#18181b"/>
        <line x1="0" y1="6" x2="0" y2="23" stroke="#e4e4e7" stroke-width="1.2"/>
        <path d="M -24,11 Q -13,6 -4,9" stroke="#71717a" stroke-width="0.8"/>
        <path d="M -24,16 Q -13,11 -4,14" stroke="#71717a" stroke-width="0.8"/>
        <path d="M 24,11 Q 13,6 4,9" stroke="#71717a" stroke-width="0.8"/>
        <path d="M 24,16 Q 13,11 4,14" stroke="#71717a" stroke-width="0.8"/>
        <path d="M 0,-14 L 2,-5 L 11,-3 L 2,-1 L 0,8 L -2,-1 L -11,-3 L -2,-5 Z" fill="#f4f4f5" stroke="none"/>
      </g>
    `;
  }

  if (variant === 2) {
    return `
      <g transform="translate(100, 138)" stroke="#a1a1aa" fill="none">
        <circle r="46" stroke="#27272a" stroke-width="1.2"/>
        <circle r="40" stroke="#3f3f46" stroke-width="0.75"/>
        <circle r="24" stroke="#e4e4e7" stroke-width="1.4" fill="#18181b"/>
        <line x1="0" y1="-36" x2="0" y2="-28" stroke="#71717a" stroke-width="1"/>
        <line x1="-18" y1="-32" x2="-12" y2="-25" stroke="#71717a" stroke-width="1"/>
        <line x1="18" y1="-32" x2="12" y2="-25" stroke="#71717a" stroke-width="1"/>
        <line x1="-38" y1="14" x2="38" y2="14" stroke="#52525b" stroke-width="0.8"/>
        <polygon points="-26,14 -9,-4 3,8 15,-1 27,14" stroke="#e4e4e7" stroke-width="1.2" fill="#111114"/>
        <polygon points="0,-42 2,-40 0,-38 -2,-40" fill="#f4f4f5" stroke="none"/>
      </g>
    `;
  }

  return `
    <g transform="translate(100, 138)" stroke="#a1a1aa" fill="none">
      <polygon points="-34,-22 0,-48 34,-22 34,18 0,48 -34,18" stroke="#27272a" stroke-width="1.2"/>
      <circle r="30" stroke="#3f3f46" stroke-width="0.75" stroke-dasharray="3,3"/>
      <line x1="0" y1="-38" x2="0" y2="28" stroke="#f4f4f5" stroke-width="1.6"/>
      <line x1="-14" y1="-14" x2="14" y2="-14" stroke="#f4f4f5" stroke-width="1.5"/>
      <circle cx="0" cy="30" r="2.5" fill="#e4e4e7" stroke="none"/>
      <polygon points="0,-44 -3.5,-36 3.5,-36" fill="#f4f4f5" stroke="none"/>
      <path d="M -19,-6 Q -27,6 -15,18" stroke="#71717a" stroke-width="1"/>
      <path d="M 19,-6 Q 27,6 15,18" stroke="#71717a" stroke-width="1"/>
      <polygon points="-18,-22 -16,-20 -18,-18 -20,-20" fill="#a1a1aa" stroke="none"/>
      <polygon points="18,-22 20,-20 18,-18 16,-20" fill="#a1a1aa" stroke="none"/>
    </g>
  `;
}

/**
 * Generates an SVG data URI matching a high-end Japanese collector's edition cover:
 * minimal retro framing, geometric art emblem, and clean metadata (no messy long title overflow).
 */
export function generateRetroCoverSvg(title = '', author = '', tag = 'READ THIS • WEB NOVEL') {
  const cleanAuthor = (author || 'Anonymous').trim();
  const cleanTag = (tag || 'READ THIS • WEB NOVEL').toUpperCase();
  const seed = getSeed((title || '') + (author || ''));
  const displayAuthor = cleanAuthor.length > 20 ? cleanAuthor.substring(0, 19) + '…' : cleanAuthor;
  const emblemSvg = renderArtEmblem(seed);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" fill="#101014"/>
  <rect x="9" y="9" width="182" height="282" fill="none" stroke="#27272a" stroke-width="1.5"/>
  <rect x="13" y="13" width="174" height="274" fill="none" stroke="#3f3f46" stroke-width="0.5"/>
  <path d="M 10 18 L 18 18 L 18 10" fill="none" stroke="#71717a" stroke-width="0.75"/>
  <path d="M 190 18 L 182 18 L 182 10" fill="none" stroke="#71717a" stroke-width="0.75"/>
  <path d="M 10 282 L 18 282 L 18 290" fill="none" stroke="#71717a" stroke-width="0.75"/>
  <path d="M 190 282 L 182 282 L 182 290" fill="none" stroke="#71717a" stroke-width="0.75"/>

  <!-- Top Category / Edition Tag -->
  <text x="100" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="700" fill="#a1a1aa" text-anchor="middle" letter-spacing="1.5">${escapeXml(cleanTag)}</text>
  <line x1="75" y1="41" x2="125" y2="41" stroke="#3f3f46" stroke-width="0.8"/>
  <polygon points="100,39.5 102,41 100,42.5 98,41" fill="#71717a"/>

  <!-- Center Minimalist Art Emblem -->
  ${emblemSvg}

  <!-- Lower Metadata / Author Section -->
  <line x1="75" y1="218" x2="125" y2="218" stroke="#3f3f46" stroke-width="0.8"/>
  <polygon points="100,216.5 102,218 100,219.5 98,218" fill="#71717a"/>
  
  <text x="100" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="5.5" font-weight="700" fill="#71717a" text-anchor="middle" letter-spacing="1.2">AUTHOR</text>
  <text x="100" y="245" font-family="system-ui, -apple-system, sans-serif, 'Noto Sans JP'" font-size="8.5" font-weight="500" fill="#e4e4e7" text-anchor="middle">${escapeXml(displayAuthor)}</text>
  <text x="100" y="272" font-family="system-ui, -apple-system, sans-serif" font-size="5" font-weight="600" fill="#52525b" text-anchor="middle" letter-spacing="1">ARCHIVE COLLECTION • DIGITAL EDITION</text>
</svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export default function CoverImage({ src, alt, title = '', author = '', className, style, ...props }) {
  const fallback = generateRetroCoverSvg(title || alt, author);
  const isGenericPlaceholder = !src || src.includes('cover_placeholder.svg');
  const initialSrc = isGenericPlaceholder ? fallback : src;

  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    const nextFallback = generateRetroCoverSvg(title || alt, author);
    if (!src || src.includes('cover_placeholder.svg')) {
      setImgSrc(nextFallback);
    } else {
      setImgSrc(src);
    }
  }, [src, title, alt, author]);

  return (
    <img
      src={imgSrc || fallback}
      alt={alt || title || 'Cover'}
      className={className}
      style={style}
      onError={() => {
        const nextFallback = generateRetroCoverSvg(title || alt, author);
        if (imgSrc !== nextFallback) {
          setImgSrc(nextFallback);
        }
      }}
      {...props}
    />
  );
}
