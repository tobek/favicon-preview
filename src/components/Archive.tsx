import { useState, useEffect, useRef, useMemo } from 'react';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Footer } from './Footer';
import { Tooltip } from './Tooltip';
import { fetchPublicArchive } from '../utils/shortlink';
import type { ArchiveTile } from '../types';

const ZOOM_LEVELS = [16, 32, 64, 128, 256];
const DEFAULT_ZOOM_INDEX = 1; // 32px

interface ArchiveProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onNavigate: (path: string) => void;
}

// Whether the device can hover (mouse/trackpad). Hybrid machines — e.g. a
// touchscreen laptop used with a mouse — report `hover: hover`, so we key the
// tooltip off hover capability rather than mere touch support (which would
// wrongly suppress it on those devices).
function canHover(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
}

export function Archive({ isDarkMode, onThemeToggle, onNavigate }: ArchiveProps) {
  const [tiles, setTiles] = useState<ArchiveTile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const tileSize = ZOOM_LEVELS[zoomIndex];
  const hoverCapable = canHover();

  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Favicon Archive — Favicon Preview';
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') ?? null;
    metaDesc?.setAttribute(
      'content',
      'A public gallery and archive of favicons shared on faviconpreview.fyi'
    );
    return () => {
      document.title = 'Favicon Preview';
      if (metaDesc && prevDesc !== null) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPublicArchive()
      .then((result) => {
        if (!cancelled) setTiles(result);
      })
      .catch((err) => {
        console.error('Failed to load archive:', err);
        if (!cancelled) setError("Couldn't load the favicon archive. Try again later.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track how many tiles fit per row so we can tell where a hovered set's
  // run breaks across rows (auto-fill columns => count = gridWidth / tileSize).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const compute = () => {
      setColumnCount(Math.max(1, Math.floor(el.clientWidth / tileSize)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileSize, tiles]);

  // Contiguous run of tiles belonging to the hovered set (same shortId).
  const hoveredRange = useMemo(() => {
    if (hoveredIndex === null || !tiles) return null;
    const shortId = tiles[hoveredIndex].shortId;
    let start = hoveredIndex;
    let end = hoveredIndex;
    while (start > 0 && tiles[start - 1].shortId === shortId) start--;
    while (end < tiles.length - 1 && tiles[end + 1].shortId === shortId) end++;
    return { start, end };
  }, [hoveredIndex, tiles]);

  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;
  const canZoomOut = zoomIndex > 0;

  const iconBtnClass = `p-2 rounded-lg transition-colors cursor-pointer ${
    isDarkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
      : 'bg-slate-300 hover:bg-slate-400 text-slate-900'
  }`;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-slate-100 to-slate-300'
      }`}
    >
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8 relative">
          {/* Top-right controls: zoom out / px / zoom in / home / dark-light */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <Tooltip content="Zoom out" position="bottom" className="hidden md:inline-flex">
              <button
                onClick={() => canZoomOut && setZoomIndex(zoomIndex - 1)}
                disabled={!canZoomOut}
                className={`${iconBtnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
            </Tooltip>
            <Tooltip content="Zoom in" position="bottom" className="hidden md:inline-flex">
              <button
                onClick={() => canZoomIn && setZoomIndex(zoomIndex + 1)}
                disabled={!canZoomIn}
                className={`${iconBtnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label="Zoom in"
              >
                <ZoomIn size={20} />
              </button>
            </Tooltip>
            <Tooltip content="Home" position="bottom" className="hidden md:inline-flex">
              <button
                onClick={() => onNavigate('/')}
                className={iconBtnClass}
                aria-label="Home"
              >
                <Home size={20} />
              </button>
            </Tooltip>
            <button
              onClick={onThemeToggle}
              className={`p-2 rounded-lg transition-colors hidden md:block cursor-pointer ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-400">
                  <circle cx="12" cy="12" r="5" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-700">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Centered header */}
          <div className="text-center space-y-4">
            <h1 className={`text-4xl font-bold transition-colors ${
              isDarkMode ? 'text-gray-100' : 'text-slate-900'
            }`}>
              Favicon Archive
            </h1>
            <p className={`text-md md:text-lg transition-colors max-w-[640px] mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Add your own favicons in the{' '}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className={`inline-block hover:underline ${
                  isDarkMode ? 'text-gray-100' : 'text-slate-900'
                }`}
              >
                favicon preview tool
              </a>
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {error ? (
          <div className={`px-6 md:px-8 py-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </div>
        ) : tiles === null ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-400 border-t-transparent" style={{ borderWidth: 3 }}></div>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid"
            style={{
              gridTemplateColumns: `repeat(auto-fill, ${tileSize}px)`,
              gridAutoRows: `${tileSize}px`,
              gap: 0,
              justifyContent: 'center',
            }}
          >
            {tiles.map((tile, i) => {
              // Outline the hovered set as one box per row-run. Borders are
              // inset shadows on an overlay layered above the image so they
              // stay visible over opaque favicons and cause no layout shift.
              let boxShadow: string | undefined;
              if (hoveredRange && i >= hoveredRange.start && i <= hoveredRange.end) {
                const startsRow = i === hoveredRange.start || i % columnCount === 0;
                const endsRow = i === hoveredRange.end || (i + 1) % columnCount === 0;
                // Match the subtitle link color (text-gray-300 / text-slate-700).
                const color = isDarkMode ? '#d1d5db' : '#334155';
                const w = 2;
                const edges = [
                  `inset 0 ${w}px 0 0 ${color}`, // top
                  `inset 0 -${w}px 0 0 ${color}`, // bottom
                ];
                if (startsRow) edges.push(`inset ${w}px 0 0 0 ${color}`); // left
                if (endsRow) edges.push(`inset -${w}px 0 0 0 ${color}`); // right
                boxShadow = edges.join(', ');
              }

              return (
                <Tooltip
                  key={`${tile.shortId}-${i}`}
                  content={tile.title}
                  position="top"
                  open={hoverCapable && !!tile.title && hoveredIndex === i}
                  className="block"
                >
                  <a
                    href={`/?s=${tile.shortId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/?s=${tile.shortId}`);
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex((prev) => (prev === i ? null : prev))}
                    style={{
                      width: tileSize,
                      height: tileSize,
                      display: 'block',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={tile.url}
                      alt={tile.title || ''}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        boxShadow,
                        transition: 'box-shadow 0.1s',
                        pointerEvents: 'none',
                        opacity: 0.5,
                      }}
                    />
                  </a>
                </Tooltip>
              );
            })}
          </div>
        )}
      </main>

      <div className="px-6 md:px-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <Footer isDarkMode={isDarkMode} onNavigate={onNavigate} onArchivePage />
        </div>
      </div>
    </div>
  );
}
