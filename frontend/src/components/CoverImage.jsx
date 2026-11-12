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

/**
 * Pure geometric diamond art emblems (nested crystal, brilliant cut, octagram, linear grid).
 * Completely free of edgy wording / slogans.
 */
function renderDiamondArt(seed) {
  const variant = seed % 4;

  if (variant === 0) {
    // Nested Concentric Diamond & Orbit
    return `
      <g stroke="#a1a1aa" fill="none">
        <polygon points="100,68 156,140 100,212 44,140" stroke="#27272a" stroke-width="1.5"/>
        <circle cx="100" cy="140" r="44" stroke="#3f3f46" stroke-width="0.75" stroke-dasharray="3,3"/>
        <polygon points="100,88 141,140 100,192 59,140" stroke="#52525b" stroke-width="1"/>
        <polygon points="100,110 125,140 100,170 75,140" stroke="#71717a" stroke-width="1.2"/>
        <line x1="100" y1="58" x2="100" y2="222" stroke="#3f3f46" stroke-width="0.75"/>
        <line x1="34" y1="140" x2="166" y2="140" stroke="#3f3f46" stroke-width="0.75"/>
        <polygon points="100,126 112,140 100,154 88,140" fill="#f4f4f5" stroke="none"/>
        <polygon points="100,56 102.5,60 100,64 97.5,60" fill="#71717a" stroke="none"/>
        <polygon points="100,216 102.5,220 100,224 97.5,220" fill="#71717a" stroke="none"/>
        <polygon points="32,140 36,137.5 40,140 36,142.5" fill="#71717a" stroke="none"/>
        <polygon points="160,140 164,137.5 168,140 164,142.5" fill="#71717a" stroke="none"/>
      </g>
    `;
  }

  if (variant === 1) {
    // Faceted Brilliant Crystal Cut
    return `
      <g stroke="#a1a1aa" fill="none">
        <polygon points="72,106 128,106 156,140 100,214 44,140" stroke="#3f3f46" stroke-width="1.2"/>
        <polygon points="82,106 118,106 134,124 100,124 66,124" stroke="#52525b" stroke-width="0.8"/>
        <line x1="44" y1="140" x2="156" y2="140" stroke="#71717a" stroke-width="1"/>
        <line x1="82" y1="106" x2="66" y2="124" stroke="#52525b" stroke-width="0.8"/>
        <line x1="118" y1="106" x2="134" y2="124" stroke="#52525b" stroke-width="0.8"/>
        <line x1="100" y1="124" x2="100" y2="140" stroke="#71717a" stroke-width="1"/>
        <line x1="66" y1="124" x2="44" y2="140" stroke="#52525b" stroke-width="0.8"/>
        <line x1="134" y1="124" x2="156" y2="140" stroke="#52525b" stroke-width="0.8"/>
        <line x1="44" y1="140" x2="100" y2="214" stroke="#71717a" stroke-width="1"/>
        <line x1="72" y1="140" x2="100" y2="214" stroke="#52525b" stroke-width="0.8"/>
        <line x1="100" y1="140" x2="100" y2="214" stroke="#a1a1aa" stroke-width="1.2"/>
        <line x1="128" y1="140" x2="100" y2="214" stroke="#52525b" stroke-width="0.8"/>
        <line x1="156" y1="140" x2="100" y2="214" stroke="#71717a" stroke-width="1"/>
        <circle cx="100" cy="144" r="48" stroke="#27272a" stroke-width="0.8" stroke-dasharray="2,3"/>
      </g>
    `;
  }

  if (variant === 2) {
    // Interlocking Dual Rhombus
    return `
      <g stroke="#a1a1aa" fill="none">
        <polygon points="100,68 156,140 100,212 44,140" stroke="#3f3f46" stroke-width="1.2"/>
        <polygon points="144,96 144,184 56,184 56,96" stroke="#27272a" stroke-width="1.2"/>
        <circle cx="100" cy="140" r="38" stroke="#52525b" stroke-width="0.75"/>
        <polygon points="100,92 136,140 100,188 64,140" stroke="#71717a" stroke-width="1"/>
        <line x1="100" y1="72" x2="100" y2="208" stroke="#52525b" stroke-width="0.8"/>
        <line x1="48" y1="140" x2="152" y2="140" stroke="#52525b" stroke-width="0.8"/>
        <polygon points="100,124 114,140 100,156 86,140" fill="#f4f4f5" stroke="none"/>
        <polygon points="100,132 106,140 100,148 94,140" fill="#18181b" stroke="none"/>
      </g>
    `;
  }

  // Linear Sacred Geometry Diamond Grid
  return `
    <g stroke="#a1a1aa" fill="none">
      <polygon points="100,68 156,140 100,212 44,140" stroke="#27272a" stroke-width="1.5"/>
      <polygon points="100,82 144,140 100,198 56,140" stroke="#3f3f46" stroke-width="1"/>
      <polygon points="100,98 132,140 100,182 68,140" stroke="#52525b" stroke-width="1"/>
      <polygon points="100,114 120,140 100,166 80,140" stroke="#71717a" stroke-width="1.2"/>
      <polygon points="100,128 109,140 100,152 91,140" fill="#f4f4f5" stroke="none"/>
      <line x1="68" y1="104" x2="132" y2="176" stroke="#3f3f46" stroke-width="0.75"/>
      <line x1="132" y1="104" x2="68" y2="176" stroke="#3f3f46" stroke-width="0.75"/>
      <circle cx="100" cy="58" r="1.5" fill="#71717a" stroke="none"/>
      <circle cx="100" cy="222" r="1.5" fill="#71717a" stroke="none"/>
      <circle cx="34" cy="140" r="1.5" fill="#71717a" stroke="none"/>
      <circle cx="166" cy="140" r="1.5" fill="#71717a" stroke="none"/>
    </g>
  `;
}

/**
 * Generates an SVG data URI matching a clean, non-edgy Japanese collector's edition cover:
 * retro framing, geometric diamond art, and clean author name (no loud slogans or edgy tags).
 */
export function generateRetroCoverSvg(title = '', author = '', tag = '') {
  const cleanAuthor = (author || 'Unknown').trim();
  const seed = getSeed((title || '') + (author || ''));
  const displayAuthor = cleanAuthor.length > 20 ? cleanAuthor.substring(0, 19) + '…' : cleanAuthor;
  const diamondArtSvg = renderDiamondArt(seed);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" fill="#101014"/>
  <rect x="9" y="9" width="182" height="282" fill="none" stroke="#27272a" stroke-width="1.5"/>
  <rect x="13" y="13" width="174" height="274" fill="none" stroke="#3f3f46" stroke-width="0.5"/>
  <path d="M 10 18 L 18 18 L 18 10" fill="none" stroke="#71717a" stroke-width="0.75"/>
  <path d="M 190 18 L 182 18 L 182 10" fill="none" stroke="#71717a" stroke-width="0.75"/>
  <path d="M 10 282 L 18 282 L 18 290" fill="none" stroke="#71717a" stroke-width="0.75"/>
  <path d="M 190 282 L 182 282 L 182 290" fill="none" stroke="#71717a" stroke-width="0.75"/>

  <!-- Top Minimal Accent -->
  <line x1="75" y1="36" x2="125" y2="36" stroke="#27272a" stroke-width="0.75"/>
  <polygon points="100,33 103,36 100,39 97,36" fill="#71717a"/>

  <!-- Center Diamond Art -->
  ${diamondArtSvg}

  <!-- Lower Section (Only clean Author name, zero edgy slogans) -->
  <line x1="75" y1="244" x2="125" y2="244" stroke="#27272a" stroke-width="0.75"/>
  <polygon points="100,241 103,244 100,247 97,244" fill="#71717a"/>
  
  <text x="100" y="262" font-family="system-ui, -apple-system, sans-serif, 'Noto Sans JP'" font-size="8.5" font-weight="500" fill="#a1a1aa" text-anchor="middle">${escapeXml(displayAuthor)}</text>
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
