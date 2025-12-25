import { useState, useEffect, useRef } from 'react';
import {
  ChromeDarkTab,
  ChromeLightTab,
  ChromeColorTab,
  SafariTahoeDarkTab,
  SafariTahoeLightTab
} from './components/tabs/index.ts';
import type { UploadedFavicon } from './types.ts';

// Example favicons - using public URLs for now
const EXAMPLE_FAVICONS = [
  { icon: '/favicon-examples/favicon.ico', title: 'Example Site 1' },
  { icon: '/favicon-examples/favicon.ico.1', title: 'Example Site 2' },
  { icon: '/favicon-examples/wikipedia.ico', title: 'Wikipedia' },
];

// Dummy favicons for context
const DUMMY_TABS = [
  { icon: 'https://www.google.com/favicon.ico', title: 'Google' },
  { icon: 'https://github.com/favicon.ico', title: 'GitHub' },
  { icon: 'https://www.youtube.com/favicon.ico', title: 'YouTube' },
  { icon: 'https://www.reddit.com/favicon.ico', title: 'Reddit' },
  { icon: 'https://stackoverflow.com/favicon.ico', title: 'Stack Overflow' },
  { icon: 'https://www.wikipedia.org/favicon.ico', title: 'Wikipedia' },
  { icon: 'https://www.twitter.com/favicon.ico', title: 'Twitter' },
  { icon: 'https://www.linkedin.com/favicon.ico', title: 'LinkedIn' },
];

// Detect initial dark mode preference
function getInitialDarkMode(): boolean {
  // Try to detect from browser
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }

  // Fallback to time of day (6pm - 6am is dark mode)
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

// Color utility functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Generate darker shade (for inactive tabs)
function darkenColor(hex: string, amount: number = 0.3): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
}

// Generate lighter shade (for bottom bar)
function lightenColor(hex: string, amount: number = 0.15): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount
  );
}

// Determine if we should use light or dark text based on background color
function shouldUseLightText(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.5;
}

// Helper function to merge uploaded favicons with dummy tabs using middle-outward strategy
function mergeFavicons(dummyTabs: typeof DUMMY_TABS, uploadedFavicons: UploadedFavicon[]) {
  const baseCount = dummyTabs.length; // Start with 6 base tabs
  const uploadCount = uploadedFavicons.length;

  // If no uploads, just use dummy tabs
  if (uploadCount === 0) {
    return dummyTabs.map(tab => ({ icon: tab.icon, title: tab.title }));
  }

  // Calculate total tabs needed (at least baseCount, more if uploads > baseCount)
  const totalTabs = Math.max(baseCount, uploadCount);

  // Create array to hold all tabs
  const result: { icon: string; title: string }[] = [];

  // Fill with dummy tabs first
  for (let i = 0; i < totalTabs; i++) {
    const dummyTab = dummyTabs[i % dummyTabs.length];
    result.push({ icon: dummyTab.icon, title: dummyTab.title });
  }

  // Replace middle-outward with uploaded favicons
  const middle = Math.floor(totalTabs / 2);

  for (let i = 0; i < uploadCount; i++) {
    let position: number;
    if (i % 2 === 0) {
      // Even index: place to the right of middle
      position = middle + Math.floor(i / 2);
    } else {
      // Odd index: place to the left of middle
      position = middle - Math.ceil(i / 2);
    }

    if (position >= 0 && position < totalTabs) {
      result[position] = {
        icon: uploadedFavicons[i].dataUrl,
        title: uploadedFavicons[i].title,
      };
    }
  }

  return result;
}

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [chromeColorTheme, setChromeColorTheme] = useState('#3d5f5a');
  const [activeTabIndex, setActiveTabIndex] = useState(1); // 2nd tab is initially active
  const [uploadedFavicons, setUploadedFavicons] = useState<UploadedFavicon[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge uploaded favicons with dummy tabs
  const allTabs = mergeFavicons(DUMMY_TABS, uploadedFavicons);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newFavicons: UploadedFavicon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.match(/^image\/(png|x-icon|svg\+xml|webp)$/)) {
        continue; // Skip non-favicon files
      }

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newFavicons.push({
        id: `${Date.now()}-${i}`,
        dataUrl,
        title: file.name.replace(/\.(png|ico|svg|webp)$/i, ''),
      });
    }

    if (newFavicons.length > 0) {
      const updatedFavicons = [...uploadedFavicons, ...newFavicons];
      setUploadedFavicons(updatedFavicons);

      // Calculate which tab position the first new favicon will occupy
      const currentUploadCount = uploadedFavicons.length;
      const newUploadCount = updatedFavicons.length;
      const baseCount = DUMMY_TABS.length;
      const totalTabs = Math.max(baseCount, newUploadCount);
      const middle = Math.floor(totalTabs / 2);

      // Calculate position for the first new favicon using middle-outward pattern
      const i = currentUploadCount;
      let position: number;
      if (i % 2 === 0) {
        position = middle + Math.floor(i / 2);
      } else {
        position = middle - Math.ceil(i / 2);
      }

      // Set this tab as active
      setActiveTabIndex(position);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  // Remove favicon
  const removeFavicon = (id: string) => {
    setUploadedFavicons(uploadedFavicons.filter(f => f.id !== id));
  };

  // Update favicon title
  const updateFaviconTitle = (id: string, newTitle: string) => {
    setUploadedFavicons(
      uploadedFavicons.map(f => (f.id === id ? { ...f, title: newTitle } : f))
    );
  };

  return (
    <div className={`min-h-screen p-8 transition-colors ${
      isDarkMode
        ? 'bg-gradient-to-br from-slate-900 to-slate-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Dark/Light Mode Toggle - Top Right */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute top-0 right-0 p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-200 hover:bg-slate-300'
          }`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            // Sun icon
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
            // Moon icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-700">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className={`text-4xl font-bold transition-colors ${
            isDarkMode ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Favicon Preview
          </h1>
          <p className={`text-lg transition-colors ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            See how your favicons look in browser tabs across different contexts
          </p>

          {/* Collapse Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCollapsed}
                onChange={(e) => setIsCollapsed(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Collapsed tabs
              </span>
            </label>
          </div>
        </div>

        {/* Favicon Upload Section */}
        <div className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDarkMode
            ? 'border-slate-600 bg-slate-800/50'
            : 'border-slate-300 bg-slate-50'
        }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".ico,.png,.svg,.webp,image/x-icon,image/png,image/svg+xml,image/webp"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                Choose Files
              </button>
              <p className={`mt-2 text-sm transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                or drag and drop favicon files here
              </p>
            </div>

            {/* Uploaded Favicons List */}
            {uploadedFavicons.length > 0 && (
              <div className="space-y-2">
                <h3 className={`text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Uploaded Favicons ({uploadedFavicons.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uploadedFavicons.map((favicon) => {
                    const inputId = `title-input-${favicon.id}`;
                    return (
                      <div
                        key={favicon.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-slate-700'
                            : 'bg-white border border-slate-200'
                        }`}
                      >
                        <img src={favicon.dataUrl} alt="" className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <input
                            id={inputId}
                            type="text"
                            value={favicon.title}
                            onChange={(e) => updateFaviconTitle(favicon.id, e.target.value)}
                            className={`text-sm px-1 py-0.5 rounded border-none outline-none bg-transparent transition-colors ${
                              isDarkMode ? 'text-slate-200' : 'text-slate-900'
                            }`}
                            style={{ width: `${Math.max(favicon.title.length * 8, 60)}px` }}
                          />
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className={`flex-shrink-0 transition-colors cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => document.getElementById(inputId)?.focus()}
                          >
                            <path d="M12 20h9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <button
                          onClick={() => removeFavicon(favicon.id)}
                          className={`cursor-pointer hover:text-red-500 transition-colors ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                          aria-label="Remove favicon"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Rows - Single Scrollable Container */}
        <div className="overflow-x-auto">
          <div className="min-w-max space-y-8 pb-4">
            {/* Chrome Dark */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Chrome - Dark Mode
              </h2>
              <div className="bg-[#202124] rounded-lg overflow-hidden">
                <div className="flex items-end gap-[2px] px-2 pt-2 bg-[#202124] min-w-max">
                  {allTabs.map((tab, i) => (
                    <ChromeDarkTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => setActiveTabIndex(i)}
                    />
                  ))}
                </div>
                <div className="h-3 bg-[#35363a]"></div>
              </div>
            </div>

            {/* Chrome Light */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Chrome - Light Mode
              </h2>
              <div className="bg-[#dee1e6] rounded-lg overflow-hidden">
                <div className="flex items-end gap-[2px] px-2 pt-2 bg-[#dee1e6] min-w-max">
                  {allTabs.map((tab, i) => (
                    <ChromeLightTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => setActiveTabIndex(i)}
                    />
                  ))}
                </div>
                <div className="h-3 bg-white"></div>
              </div>
            </div>

            {/* Chrome Color */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  Chrome - Color Theme
                </h2>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="color"
                    value={chromeColorTheme}
                    onChange={(e) => setChromeColorTheme(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none"
                    title="Pick a theme color"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <path d="M12 20h9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </label>
              </div>
              <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: darkenColor(chromeColorTheme, 0.2) }}
              >
                <div
                  className="flex items-end gap-[2px] px-2 pt-2 min-w-max"
                  style={{ backgroundColor: darkenColor(chromeColorTheme, 0.2) }}
                >
                  {allTabs.map((tab, i) => (
                    <ChromeColorTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      bgColor={chromeColorTheme}
                      onClick={() => setActiveTabIndex(i)}
                    />
                  ))}
                </div>
                <div
                  className="h-3"
                  style={{ backgroundColor: lightenColor(chromeColorTheme, 0.15) }}
                ></div>
              </div>
            </div>

            {/* Safari Tahoe Dark */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Safari Tahoe - Dark Mode
              </h2>
              <div className="bg-[#1c1c1e] p-3 rounded-lg overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-max">
                  {allTabs.map((tab, i) => (
                    <SafariTahoeDarkTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => setActiveTabIndex(i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Safari Tahoe Light */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-700'
              }`}>
                Safari Tahoe - Light Mode
              </h2>
              <div className="bg-[#e8e8ed] p-3 rounded-lg overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-max">
                  {allTabs.map((tab, i) => (
                    <SafariTahoeLightTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => setActiveTabIndex(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
