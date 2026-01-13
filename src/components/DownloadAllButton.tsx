import { useState } from 'react';
import type { CompressedFavicon } from '../types';
import { downloadAllFavicons } from '../utils/zipDownload';

interface DownloadAllButtonProps {
  favicons: CompressedFavicon[];
  isDarkMode: boolean;
}

export function DownloadAllButton({ favicons, isDarkMode }: DownloadAllButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setProgress({ current: 0, total: favicons.length });

    try {
      await downloadAllFavicons(favicons, {
        filename: 'favicons.zip',
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
      });
    } catch (error) {
      console.error('Failed to create zip:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownloadAll}
      disabled={isDownloading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isDownloading
          ? isDarkMode
            ? 'bg-gray-700 text-gray-500 cursor-wait'
            : 'bg-slate-200 text-slate-500 cursor-wait'
          : isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
      }`}
    >
      {isDownloading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          Creating zip ({progress.current}/{progress.total})...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download All
        </span>
      )}
    </button>
  );
}
