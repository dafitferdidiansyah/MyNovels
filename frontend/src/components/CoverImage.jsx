import React, { useState, useEffect } from 'react';

/**
 * Generates an SVG data URI matching the Syosetu / Retro B&W aesthetic
 * with double-border framing, category header, centered title, and author.
 */
export function generateRetroCoverSvg(title = '', author = '', tag = 'READ THIS • WEB NOVEL') {
  const cleanTitle = (title || 'UNTITLED NOVEL').trim();
  const cleanAuthor = (author || 'Anonymous').trim();
  const cleanTag = (tag || 'READ THIS • WEB NOVEL').toUpperCase();

  // Simple line wrapping for SVG text
  const lines = [];
  let cur = '';
  if (/[\u3000-\u9fff]/.test(cleanTitle)) {
    for (let i = 0; i < cleanTitle.length; i += 9) {
      lines.push(cleanTitle.substring(i, i + 9));
      if (lines.length >= 5) break;
    }
  } else {
    const rawWords = cleanTitle.split(' ');
    for (const w of rawWords) {
      if ((cur + ' ' + w).trim().length > 15) {
        if (cur) lines.push(cur.trim());
        cur = w;
        if (lines.length >= 4) break;
      } else {
        cur += (cur ? ' ' : '') + w;
      }
    }
    if (cur && lines.length < 5) lines.push(cur.trim());
  }

  const startY = 145 - ((lines.length - 1) * 11);
  const titleSvgLines = lines
    .map((l, idx) => `<text x="100" y="${startY + (idx * 22)}" font-family="sans-serif, 'Noto Sans JP', 'MS Gothic'" font-size="13" font-weight="700" fill="#f4f4f5" text-anchor="middle">${escapeXml(l)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect width="200" height="300" fill="#111114"/>
  <!-- Outer & Inner Retro Borders -->
  <rect x="9" y="9" width="182" height="282" fill="none" stroke="#38383e" stroke-width="1.5"/>
  <rect x="13" y="13" width="174" height="274" fill="none" stroke="#71717a" stroke-width="0.5"/>
  
  <!-- Header Tag -->
  <text x="100" y="36" font-family="sans-serif" font-size="6.5" font-weight="600" fill="#a1a1aa" text-anchor="middle" letter-spacing="1">${escapeXml(cleanTag)}</text>
  <line x1="85" y1="42" x2="115" y2="42" stroke="#38383e" stroke-width="1"/>
  
  <!-- Centered Title Lines -->
  ${titleSvgLines}
  
  <!-- Author Section -->
  <line x1="88" y1="230" x2="112" y2="230" stroke="#38383e" stroke-width="1"/>
  <text x="100" y="240" font-family="sans-serif" font-size="6" font-weight="600" fill="#71717a" text-anchor="middle" letter-spacing="0.5">AUTHOR</text>
  <text x="100" y="254" font-family="sans-serif, 'Noto Sans JP'" font-size="9" font-weight="500" fill="#e4e4e7" text-anchor="middle">${escapeXml(cleanAuthor)}</text>
</svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
