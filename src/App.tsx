import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChromeDarkTab,
  ChromeLightTab,
  ChromeColorTab,
  SafariTahoeDarkTab,
  SafariTahoeLightTab
} from './components/tabs/index.ts';
import type { CompressedFavicon } from './types.ts';
import { Tooltip } from './components/Tooltip';
import { compressImage } from './utils/imageCompression';
import { ShareButton } from './components/ShareButton';
import { loadShortlink } from './utils/shortlink';

// Dummy favicons for context
const DUMMY_TABS = [
  { icon: 'https://www.google.com/favicon.ico', title: 'Google' },
  { icon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico', title: 'Wikipedia' },
  { icon: 'https://www.youtube.com/s/desktop/73a518d0/img/favicon_32x32.png', title: 'YouTube' },
  { icon: 'https://stackoverflow.com/favicon.ico', title: 'Stack Overflow' },
  { icon: 'https://slatestarcodex.com/favicon.ico', title: 'Slate Star Codex' },
];

// Available favicons for cycling in the browser tab
const FAV_PREV_FAVICONS = Array.from({ length: 16 }, (_, i) =>
  `/favicons/fav${String(i + 1).padStart(2, '0')}.png`
);

// Detect initial collapsed state based on viewport width
function getInitialCollapsedState(): boolean {
  return window.innerWidth < 500;
}

// Detect if browser is Safari
function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// Detect if URL has share parameters
function hasShareParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('s');
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

// Determine if we should use light or dark text based on background color (currently unused)
// function shouldUseLightText(hex: string): boolean {
//   const rgb = hexToRgb(hex);
//   if (!rgb) return false;
//   // Calculate relative luminance
//   const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
//   return luminance < 0.5;
// }

// Helper function to merge uploaded favicons with dummy tabs
function mergeFavicons(
  dummyTabs: typeof DUMMY_TABS,
  uploadedFavicons: CompressedFavicon[],
  closedDummyIndices: number[]
): { icon: string; title: string; id?: string; dummyIndex?: number }[] {
  const baseCount = dummyTabs.length; // Start with 5 base tabs
  const uploadCount = uploadedFavicons.length;

  // Filter out closed dummy tabs
  const availableDummyTabs = dummyTabs
    .map((tab, index) => ({ ...tab, originalIndex: index }))
    .filter(tab => !closedDummyIndices.includes(tab.originalIndex));

  // If no uploads and no available dummy tabs, return empty
  if (uploadCount === 0 && availableDummyTabs.length === 0) {
    return [];
  }

  // If no uploads, just use available dummy tabs
  if (uploadCount === 0) {
    return availableDummyTabs.map(tab => ({
      icon: tab.icon,
      title: tab.title,
      id: undefined,
      dummyIndex: tab.originalIndex
    }));
  }

  // Calculate total tabs needed
  // Reduce total when dummy tabs are closed
  const totalTabs = Math.max(uploadCount, baseCount - closedDummyIndices.length);

  // Create array to hold all tabs
  const result: { icon: string; title: string; id?: string; dummyIndex?: number }[] = [];

  // Fill with available dummy tabs first (cycling if needed)
  for (let i = 0; i < totalTabs; i++) {
    if (availableDummyTabs.length > 0) {
      const dummyTab = availableDummyTabs[i % availableDummyTabs.length];
      result.push({
        icon: dummyTab.icon,
        title: dummyTab.title,
        dummyIndex: dummyTab.originalIndex
      });
    }
  }

  // Replace from the start with uploaded favicons
  for (let i = 0; i < uploadCount; i++) {
    result[i] = {
      icon: uploadedFavicons[i].dataUrl,
      title: uploadedFavicons[i].title,
      id: uploadedFavicons[i].id,
    };
  }

  return result;
}

function App() {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);
  // body class is set in index.html
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark'));
  const [chromeColorTheme, setChromeColorTheme] = useState('#4a2b50');
  const [activeTabIndex, setActiveTabIndex] = useState(1); // 2nd tab is initially active
  const [uploadedFavicons, setUploadedFavicons] = useState<CompressedFavicon[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingShared, setIsLoadingShared] = useState(hasShareParams);
  const [currentBrowserTabFaviconId, setCurrentBrowserTabFaviconId] = useState<string | null>(null);
  const [loadingFavicons, setLoadingFavicons] = useState<Array<{ id: string; fileName: string }>>([]);
  const [faviconsModified, setFaviconsModified] = useState(false);
  const [isSharedPreview, setIsSharedPreview] = useState(false);
  const [isUploadSectionExpanded, setIsUploadSectionExpanded] = useState(false);
  const [isCyclingFavicons, setIsCyclingFavicons] = useState(!isSafari());
  const [closedDummyTabIndices, setClosedDummyTabIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Merge uploaded favicons with dummy tabs
  const allTabs = mergeFavicons(DUMMY_TABS, uploadedFavicons, closedDummyTabIndices);

  // Update favicon in browser tab (works in Chrome/Firefox/Edge, not Safari)
  const updateFavicon = useCallback((faviconUrl: string) => {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, []);

  // Cycle through favicons in browser tab every 1 second
  useEffect(() => {
    if (!isCyclingFavicons) return;

    let previousFavicon: string | null = null;

    const getRandomFavicon = () => {
      let randomIndex: number;
      let newFavicon: string;

      // Keep trying until we get a different favicon
      do {
        randomIndex = Math.floor(Math.random() * FAV_PREV_FAVICONS.length);
        newFavicon = FAV_PREV_FAVICONS[randomIndex];
      } while (newFavicon === previousFavicon && FAV_PREV_FAVICONS.length > 1);

      previousFavicon = newFavicon;
      return newFavicon;
    };

    // Set initial random favicon
    const initialFavicon = getRandomFavicon();
    updateFavicon(initialFavicon);

    // Cycle every 1 second
    const intervalId = setInterval(() => {
      const randomFavicon = getRandomFavicon();
      updateFavicon(randomFavicon);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isCyclingFavicons, updateFavicon]);

  // Load shared state from URL on mount
  useEffect(() => {
    const loadSharedState = async () => {
      const params = new URLSearchParams(window.location.search);
      const shortId = params.get('s');

      if (!shortId) {
        setIsLoadingShared(false);
        return;
      }

      const sharedState = await loadShortlink(shortId);
      if (!sharedState) {
        setLoadError('This share link is invalid or has expired.');
        setIsLoadingShared(false);
        return;
      }

      try {
        // Validate image URLs
        const validationResults = await Promise.all(
          sharedState.favicons.map(async (favicon) => {
            try {
              const response = await fetch(favicon.url, { method: 'HEAD' });
              return {
                url: favicon.url,
                title: favicon.title,
                isValid: response.ok,
              };
            } catch {
              return {
                url: favicon.url,
                title: favicon.title,
                isValid: false,
              };
            }
          })
        );

        const failedUrls = validationResults.filter((r) => !r.isValid);

        // Show error if any images are missing
        if (failedUrls.length > 0) {
          const failedCount = failedUrls.length;
          const totalCount = validationResults.length;
          setLoadError(
            `${failedCount} of ${totalCount} favicon${failedCount > 1 ? 's are' : ' is'} no longer available or expired.`
          );
        }

        // Load available favicons
        const availableFavicons = validationResults
          .filter((r) => r.isValid)
          .map((r, i) => ({
            id: `shared-${Date.now()}-${i}`,
            dataUrl: r.url,
            uploadedImageUrl: r.url,
            title: r.title,
          }));

        setUploadedFavicons(availableFavicons);
        if (availableFavicons.length > 0) {
          setActiveTabIndex(0);
        }

        // Set chrome color theme
        setChromeColorTheme(`#${sharedState.color}`);

        // Load closed dummy tabs
        if (sharedState.closedDummyTabs) {
          setClosedDummyTabIndices(sharedState.closedDummyTabs);
        }

        // Mark as shared preview
        setIsSharedPreview(true);

        // Preview first favicon in browser tab
        if (availableFavicons.length > 0) {
          const firstFavicon = availableFavicons[0];
          previewFaviconInTab(firstFavicon.dataUrl, firstFavicon.id);
        }
      } catch (error) {
        console.error('Failed to load shared state:', error);
        setLoadError('Failed to load shared preview. The link may be invalid or corrupted.');
      } finally {
        setIsLoadingShared(false);
      }
    };

    loadSharedState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to check if file is a valid image format
  const isValidImageFile = (file: File): boolean => {
    // Check MIME type - accept any image
    if (file.type.startsWith('image/')) {
      return true;
    }
    // Fallback: check file extension for common image formats
    return /\.(png|ico|svg|webp|jpg|jpeg|gif|bmp|tiff|tif)$/i.test(file.name);
  };

  // Preview favicon in actual browser tab
  const previewFaviconInTab = useCallback((dataUrl: string, faviconId?: string, userInitiated = false) => {
    // Show alert only when user explicitly clicks to preview on Safari
    if (userInitiated && isSafari()) {
      alert("Safari doesn't support dynamic favicon updates. Try a modern browser like Chrome or Firefox for full support.");
      return;
    }

    // Stop cycling favicons when user previews their own
    if (isCyclingFavicons) {
      setIsCyclingFavicons(false);
    }

    updateFavicon(dataUrl);

    // Update current browser tab favicon ID (or clear when previewing dummy tabs)
    setCurrentBrowserTabFaviconId(faviconId ?? null);
  }, [isCyclingFavicons, updateFavicon]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    // Add all files to loading state immediately
    const loadingItems = Array.from(files)
      .filter(isValidImageFile)
      .map((file, i) => ({
        id: `loading-${Date.now()}-${i}`,
        fileName: file.name.replace(/\.(png|ico|svg|webp|jpg|jpeg|gif|bmp|tiff|tif)$/i, ''),
      }));

    setLoadingFavicons(prev => [...prev, ...loadingItems]);

    const newFavicons: CompressedFavicon[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!isValidImageFile(file)) {
        continue; // Skip non-image files
      }

      const loadingId = loadingItems[newFavicons.length]?.id;

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Compress image for storage and future upload
      const compressedDataUrl = await compressImage(dataUrl);

      newFavicons.push({
        id: `${Date.now()}-${i}`,
        dataUrl,
        compressedDataUrl,
        title: file.name.replace(/\.(png|ico|svg|webp|jpg|jpeg|gif|bmp|tiff|tif)$/i, ''),
      });

      // Remove from loading state after compression
      if (loadingId) {
        setLoadingFavicons(prev => prev.filter(item => item.id !== loadingId));
      }
    }

    if (newFavicons.length > 0) {
      const lastFavicon = newFavicons[newFavicons.length - 1];

      setUploadedFavicons(prev => {
        const firstNewIndex = prev.length;
        const lastIndex = firstNewIndex + newFavicons.length - 1;
        const updatedFavicons = [...prev, ...newFavicons];

        setActiveTabIndex(lastIndex);
        previewFaviconInTab(lastFavicon.dataUrl, lastFavicon.id);

        return updatedFavicons;
      });

      setFaviconsModified(true);
    }
  }, [previewFaviconInTab]);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Skip if pasting into a text input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Check if clipboard contains files
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        // Convert to FileList using DataTransfer
        const dt = new DataTransfer();
        imageFiles.forEach(file => dt.items.add(file));
        await handleFileUpload(dt.files);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFileUpload]);

  // Handle drag and drop - full page
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Remove favicon
  const removeFavicon = (id: string) => {
    setUploadedFavicons(uploadedFavicons.filter(f => f.id !== id));
    setFaviconsModified(true);
  };

  // Handle tab close
  const handleTabClose = (index: number) => {
    const tab = allTabs[index];
    if (tab.id) {
      // User-uploaded favicon - remove it
      removeFavicon(tab.id);
    } else if (tab.dummyIndex !== undefined) {
      // Dummy tab - track as closed
      setClosedDummyTabIndices(prev => [...prev, tab.dummyIndex!]);
      setFaviconsModified(true);
    }
    // Adjust active tab if needed
    if (activeTabIndex >= allTabs.length - 1) {
      setActiveTabIndex(Math.max(0, allTabs.length - 2));
    } else if (index < activeTabIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  // Update favicon title
  const updateFaviconTitle = (id: string, newTitle: string) => {
    setUploadedFavicons(
      uploadedFavicons.map(f => (f.id === id ? { ...f, title: newTitle } : f))
    );
    setFaviconsModified(true);
  };

  // Hide initial loading content when React mounts
  useEffect(() => {
    const initialContent = document.getElementById('initial-content');
    if (initialContent) {
      initialContent.style.display = 'none';
    }
  }, []);

  // Sync body class with dark mode state
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [isDarkMode]);

  // Handle tab selection
  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
    const tab = allTabs[index];
    if (tab) {
      previewFaviconInTab(tab.icon, tab.id);
    }
  };

  // Handle theme toggle and save preference
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    // Save preference to localStorage with timestamp
    try {
      localStorage.setItem('theme-preference', JSON.stringify({
        theme: newTheme ? 'dark' : 'light',
        timestamp: Date.now()
      }));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Download favicon (compressed version if available)
  const downloadFavicon = async (e: React.MouseEvent, favicon: CompressedFavicon) => {
    e.preventDefault();
    e.stopPropagation();

    const imageUrl = favicon.compressedDataUrl || favicon.dataUrl;
    // Sanitize filename
    const sanitizedTitle = favicon.title.replace(/[^a-z0-9_.-]/gi, '_');
    const filename = `${sanitizedTitle}-favicon.png`;

    // For external URLs (like Firebase Storage), we need to fetch and convert to blob
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (error) {
        console.error('Failed to download favicon:', error);
      }
    } else {
      // For data URLs, use the standard approach
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className={`min-h-screen p-6 md:p-8 transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-slate-100 to-slate-300'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Load Error Banner */}
      {loadError && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className={`px-4 py-3 rounded-lg flex items-start justify-between ${
            isDarkMode
              ? 'bg-yellow-900/50 border border-yellow-700 text-yellow-200'
              : 'bg-yellow-100 border border-yellow-300 text-yellow-900'
          }`}>
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="flex-shrink-0 mt-0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="font-medium">Shared Preview Warning</p>
                <p className="text-sm mt-1">{loadError}</p>
              </div>
            </div>
            <button
              onClick={() => setLoadError(null)}
              className={`flex-shrink-0 transition-colors ${
                isDarkMode
                  ? 'text-yellow-200 hover:text-yellow-100'
                  : 'text-yellow-900 hover:text-yellow-950'
              }`}
              aria-label="Dismiss"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Full-page drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`absolute inset-0 transition-colors ${
            isDarkMode
              ? 'bg-gray-900/90 backdrop-blur-sm'
              : 'bg-slate-100/90 backdrop-blur-sm'
          }`}>
            <div className={`absolute inset-0 border-4 border-dashed m-4 rounded-2xl ${
              isDarkMode ? 'border-gray-600' : 'border-slate-300'
            }`}></div>
          </div>
          <div className={`relative z-10 flex flex-col items-center gap-4 ${
            isDarkMode ? 'text-gray-100' : 'text-slate-900'
          }`}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={isDarkMode ? 'text-gray-400' : 'text-slate-600'}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-2xl font-semibold">Drop image files anywhere</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 relative">
        {/* Dark/Light Mode Toggle - Top Right */}
        <button
          onClick={handleThemeToggle}
          className={`absolute top-0 right-0 p-2 rounded-lg transition-colors hidden md:block cursor-pointer ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-slate-300 hover:bg-slate-400'
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
            isDarkMode ? 'text-gray-100' : 'text-slate-900'
          }`}>
            Favicon Preview
          </h1>
          <p className={`text-md md:text-lg transition-colors -mb-3 md:mb-0 ${
            isDarkMode ? 'text-gray-400' : 'text-slate-600'
          }`}>
            Preview and share how your favicons will look across browser tab themes
          </p>
        </div>

        {isLoadingShared ? (
          /* Loading Shared State Indicator */
          <div className="max-w-7xl mx-auto mb-8">
            <div className={`px-4 py-3 rounded-lg flex items-center gap-3 ${
              isDarkMode
                ? 'bg-gray-800 border border-gray-700 text-gray-300'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
              <p>Loading shared preview...</p>
            </div>
          </div>
        ) : (
          /* Favicon Upload Section */
          <div className={`rounded-lg border-2 border-dashed transition-colors ${
            isDarkMode
              ? 'border-gray-600 bg-gray-800/50'
              : 'border-slate-300 bg-slate-50'
          }`}>
            <div className={`transition-all overflow-hidden ${
              uploadedFavicons.length >= 3 && !isUploadSectionExpanded ? 'max-h-[180px] md:max-h-none' : 'max-h-none'
            }`}>
              <div className="p-6 space-y-4">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                      : 'bg-gray-200 hover:bg-slate-300 text-slate-900'
                  }`}
                >
                  Choose Files
                </button>
                <p className={`mt-2 text-sm transition-colors hidden md:block ${
                  isDarkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>or drag and drop image files here</p>
                <p className={`text-sm transition-colors hidden md:block ${
                  isDarkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>or use cmd/ctrl+v to paste an image</p>
              </div>

              {/* Uploaded Favicons List */}
              {(uploadedFavicons.length > 0 || loadingFavicons.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Loaded Favicons ({uploadedFavicons.length}{loadingFavicons.length > 0 ? ` + ${loadingFavicons.length} loading` : ''})
                    </h3>
                    {uploadedFavicons.length > 0 && (
                      <Tooltip content="Clear all">
                        <button
                          onClick={() => {
                            setUploadedFavicons([]);
                            setFaviconsModified(true);
                          }}
                          className={`cursor-pointer hover:text-red-500 transition-colors ${
                            isDarkMode ? 'text-gray-400' : 'text-slate-500'
                          }`}
                          aria-label="Clear all favicons"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Uploaded favicons */}
                    {uploadedFavicons.map((favicon) => {
                      const inputId = `title-input-${favicon.id}`;
                      return (
                        <div
                          key={favicon.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700'
                              : 'bg-white border border-slate-200'
                          }`}
                        >
                          <img src={favicon.dataUrl} alt="" className="w-4 h-4 object-contain" />
                          <div className="flex items-center gap-1">
                            <div className="relative inline-block">
                              <span className={`invisible whitespace-pre text-sm px-1 py-0.5 ${
                                isDarkMode ? 'text-gray-200' : 'text-slate-900'
                              }`}>
                                {favicon.title || ' '}
                              </span>
                              <input
                                id={inputId}
                                type="text"
                                value={favicon.title}
                                onChange={(e) => updateFaviconTitle(favicon.id, e.target.value)}
                                className={`absolute left-0 top-0 w-full text-sm px-1 py-0.5 rounded border-none outline-none bg-transparent transition-colors ${
                                  isDarkMode ? 'text-gray-200' : 'text-slate-900'
                                }`}
                              />
                            </div>
                            <Tooltip content="Edit title">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className={`flex-shrink-0 transition-colors cursor-pointer ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => document.getElementById(inputId)?.focus()}
                              >
                                <path d="M12 20h9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Tooltip>
                          </div>
                          <Tooltip content="Preview in browser tab" className="hidden md:inline-flex">
                            <button
                              onClick={() => previewFaviconInTab(favicon.dataUrl, favicon.id, true)}
                              className={`cursor-pointer transition-colors ${
                                currentBrowserTabFaviconId === favicon.id
                                  ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                  : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                              }`}
                              aria-label="Preview in browser tab"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                          </Tooltip>
                          <Tooltip content="Download favicon">
                            <button
                              onClick={(e) => downloadFavicon(e, favicon)}
                              className={`cursor-pointer transition-colors ${
                                isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                              }`}
                              aria-label="Download favicon"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            </button>
                          </Tooltip>
                          <Tooltip content="Remove favicon">
                            <button
                              onClick={() => removeFavicon(favicon.id)}
                              className={`cursor-pointer hover:text-red-500 transition-colors ${
                                isDarkMode ? 'text-gray-400' : 'text-slate-500'
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
                          </Tooltip>
                        </div>
                      );
                    })}
                    {/* Loading favicons */}
                    {loadingFavicons.map((loading) => (
                      <div
                        key={loading.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700'
                            : 'bg-white border border-slate-200'
                        }`}
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                        </div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                          {loading.fileName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
            {/* Expand/Collapse Button - Mobile only, when 3+ favicons */}
            {uploadedFavicons.length >= 3 && (
              <button
                onClick={() => setIsUploadSectionExpanded(!isUploadSectionExpanded)}
                className={`w-full py-2 text-sm font-medium transition-colors border-t md:hidden ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                    : 'border-slate-300 text-slate-600 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isUploadSectionExpanded ? 'Show fewer' : 'Show all'}
              </button>
            )}
          </div>
        )}

        {/* Share Button - Outside upload area */}
        {/* Hide if this is a shared preview and nothing has been modified, or if isLoadingShared */}
        {!(isSharedPreview && !faviconsModified) && !isLoadingShared && (
          <div className="flex justify-center">
            {uploadedFavicons.length === 0 ? (
              <Tooltip content="Upload favicons to share them">
                <div>
                  <ShareButton
                    uploadedFavicons={uploadedFavicons}
                    chromeColorTheme={chromeColorTheme}
                    isDarkMode={isDarkMode}
                    faviconsModified={faviconsModified}
                    closedDummyTabIndices={closedDummyTabIndices}
                    onShareSuccess={() => {
                      setFaviconsModified(false);
                      setIsSharedPreview(false);
                    }}
                  />
                </div>
              </Tooltip>
            ) : (
              <ShareButton
                uploadedFavicons={uploadedFavicons}
                chromeColorTheme={chromeColorTheme}
                isDarkMode={isDarkMode}
                faviconsModified={faviconsModified}
                closedDummyTabIndices={closedDummyTabIndices}
                onShareSuccess={() => {
                  setFaviconsModified(false);
                  setIsSharedPreview(false);
                }}
              />
            )}
          </div>
        )}

        {/* Preview Rows - Single Scrollable Container */}
        <div className="relative">
          {/* Collapse Toggle - Positioned absolutely at right, aligned with first heading */}
          <div className="absolute right-0 top-0 z-10 opacity-80 hover:opacity-100 transition-opacity">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCollapsed}
                onChange={(e) => setIsCollapsed(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-slate-700'
              }`}>
                Collapse tabs
              </span>
            </label>
          </div>

          <div className="overflow-x-auto">
          <div className="min-w-max space-y-8 pb-4">
            {/* Chrome Dark */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-slate-700'
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
                      onClick={() => handleTabClick(i)}
                      onClose={() => handleTabClose(i)}
                    />
                  ))}
                </div>
                <div className="h-3 bg-[#35363a]"></div>
              </div>
            </div>

            {/* Chrome Light */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-slate-700'
              }`}>
                Chrome - Light Mode
              </h2>
              <div className="bg-[#d3e3fd] rounded-lg overflow-hidden">
                <div className="flex items-end gap-[2px] px-2 pt-2 bg-[#d3e3fd] min-w-max">
                  {allTabs.map((tab, i) => (
                    <ChromeLightTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => handleTabClick(i)}
                      onClose={() => handleTabClose(i)}
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
                  isDarkMode ? 'text-gray-400' : 'text-slate-700'
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`transition-colors ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
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
                      onClick={() => handleTabClick(i)}
                      onClose={() => handleTabClose(i)}
                    />
                  ))}
                </div>
                <div
                  className="h-3"
                  style={{ backgroundColor: chromeColorTheme }}
                ></div>
              </div>
            </div>

            {/* Safari Tahoe Dark */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-slate-700'
              }`}>
                Safari - Dark Mode
              </h2>
              <div className="bg-[#1c1c1e] p-3 rounded-lg overflow-hidden w-[1280px] max-w-[calc(100vw-3rem)] md:max-w-[calc(100vw-5rem)]">
                <div className="flex items-center gap-1.5 w-full">
                  {allTabs.map((tab, i) => (
                    <SafariTahoeDarkTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => handleTabClick(i)}
                      onClose={() => handleTabClose(i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Safari Tahoe Light */}
            <div className="space-y-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-gray-400' : 'text-slate-700'
              }`}>
                Safari - Light Mode
              </h2>
              <div className="bg-[#e8e8ed] p-3 rounded-lg overflow-hidden w-[1280px] max-w-[calc(100vw-3rem)] md:max-w-[calc(100vw-5rem)]">
                <div className="flex items-center gap-1.5 w-full">
                  {allTabs.map((tab, i) => (
                    <SafariTahoeLightTab
                      key={i}
                      favicon={tab.icon}
                      title={tab.title}
                      isActive={i === activeTabIndex}
                      isCollapsed={isCollapsed}
                      onClick={() => handleTabClick(i)}
                      onClose={() => handleTabClose(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 md:mt-16 space-y-1">
          <p className={`text-sm transition-colors ${
            isDarkMode ? 'text-gray-500' : 'text-slate-400'
          }`}>
            Made by{' '}
            <a
              href="https://tobyfox.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${
                isDarkMode ? 'text-gray-400' : 'text-slate-500'
              }`}
            >
              Toby Fox
            </a>
          </p>
          <p className={`text-sm transition-colors ${
            isDarkMode ? 'text-gray-500' : 'text-slate-400'
          }`}>
            Feedback?{' '}
            <a
              href="https://github.com/tobek/favicon-preview"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${
                isDarkMode ? 'text-gray-400' : 'text-slate-500'
              }`}
            >
              Open an issue on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
