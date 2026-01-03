import { useState, useEffect, useRef } from 'react';
import type { CompressedFavicon } from '../types';
import {
  uploadMultipleToFirebase,
  hasFirebaseConfig,
} from '../utils/firebaseUpload';
import { generateShareUrl, getUrlLengthWarning } from '../utils/shareUrl';
import { createShortlink } from '../utils/shortlink';

interface ShareButtonProps {
  uploadedFavicons: CompressedFavicon[];
  chromeColorTheme: string;
  isDarkMode: boolean;
  faviconsModified: boolean;
  onShareSuccess: () => void;
}

type ShareState = 'idle' | 'uploading' | 'success' | 'error';

export function ShareButton({ uploadedFavicons, chromeColorTheme, isDarkMode, faviconsModified, onShareSuccess }: ShareButtonProps) {
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [partialFailures, setPartialFailures] = useState<Array<{ id: string; error: string }>>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimeoutRef = useRef<number | null>(null);

  const hasCredentials = hasFirebaseConfig();
  const canShare = uploadedFavicons.length > 0 && hasCredentials;

  // Check if favicons have changed since last share
  const faviconsChanged = shareState === 'success' && faviconsModified;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (linkCopiedTimeoutRef.current) {
        clearTimeout(linkCopiedTimeoutRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (!canShare) return;

    setShareState('uploading');
    setErrorMessage('');
    setPartialFailures([]);

    if (!hasFirebaseConfig()) {
      setErrorMessage('Firebase not configured. Please add Firebase credentials to your .env.local file.');
      setShareState('error');
      return;
    }

    try {
      // Check URL length warning
      const lengthWarning = getUrlLengthWarning(
        uploadedFavicons.map(f => ({ url: 'placeholder', title: f.title })),
        chromeColorTheme
      );

      if (lengthWarning) {
        console.warn(lengthWarning);
      }

      // Upload images to Firebase Storage
      const imagesToUpload = uploadedFavicons.map((favicon) => ({
        id: favicon.id,
        compressedDataUrl: favicon.compressedDataUrl || favicon.dataUrl,
        fileName: `${favicon.title}.png`,
      }));

      setUploadProgress({ completed: 0, total: imagesToUpload.length });

      const uploadResults = await uploadMultipleToFirebase(imagesToUpload);

      // Update progress as complete
      setUploadProgress({ completed: imagesToUpload.length, total: imagesToUpload.length });

      // Check for failures
      const failures = uploadResults.filter((result) => result.error !== null);
      const successes = uploadResults.filter((result) => !!result.url);

      if (successes.length === 0) {
        setErrorMessage('All uploads failed. Please check your network connection and try again.');
        setShareState('error');
        return;
      }

      if (failures.length > 0) {
        setPartialFailures(
          failures.map((f) => ({
            id: f.id,
            error: f.error || 'Unknown error',
          }))
        );
      }

      // Generate share URL with successful uploads
      const successfulFavicons = successes
        .map((result) => {
          const originalFavicon = uploadedFavicons.find((f) => f.id === result.id);
          return originalFavicon
            ? { url: result.url!, title: originalFavicon.title }
            : null;
        })
        .filter((f): f is { url: string; title: string } => f !== null);

      // Update favicons with uploaded URLs for shortlink creation
      const uploadedFaviconsWithUrls = uploadedFavicons.map(f => {
        const uploadResult = uploadResults.find(r => r.id === f.id);
        return {
          ...f,
          uploadedImageUrl: uploadResult?.url || undefined
        };
      }).filter(f => f.uploadedImageUrl); // Only include successfully uploaded favicons

      // Try to create shortlink
      const shortId = await createShortlink(uploadedFaviconsWithUrls, chromeColorTheme);

      let url: string;
      if (shortId) {
        // Success - use short URL
        url = `${window.location.origin}/?s=${shortId}`;
      } else {
        // Failed - fall back to long URL (silent)
        url = generateShareUrl(successfulFavicons, chromeColorTheme);
      }

      setShareUrl(url);
      setShareState('success');
      onShareSuccess();
    } catch (error) {
      console.error('Share failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create share link');
      setShareState('error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);

      // Clear existing timeout if any
      if (linkCopiedTimeoutRef.current) {
        clearTimeout(linkCopiedTimeoutRef.current);
      }

      // Reset after 2 seconds
      linkCopiedTimeoutRef.current = setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback: select the text
      const input = document.querySelector('#share-url-input') as HTMLInputElement;
      if (input) {
        input.select();
        alert('Press Ctrl+C (Cmd+C on Mac) to copy the link');
      }
    }
  };

  const handleRetry = () => {
    setShareState('idle');
    setErrorMessage('');
    setPartialFailures([]);
    handleShare();
  };

  if (!hasCredentials) {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        <p>Firebase not configured</p>
        <p className="text-xs mt-1">
          Add Firebase credentials to .env.local (see .env.local.example)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Share Button */}
      {shareState === 'idle' && (
        <button
          onClick={handleShare}
          disabled={!canShare}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            canShare
              ? isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              : isDarkMode
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          Share Preview
        </button>
      )}

      {/* Uploading State */}
      {shareState === 'uploading' && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
            <span>
              Uploading {uploadProgress.completed}/{uploadProgress.total}...
            </span>
          </div>
        </div>
      )}

      {/* Success State */}
      {shareState === 'success' && (
        <div className="space-y-2 w-full max-w-4xl">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            Share link created!
            {partialFailures.length > 0 && (
              <span className={`ml-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                ({partialFailures.length} upload(s) failed)
              </span>
            )}
          </div>

          {/* URL Input and Copy Button */}
          <div className="flex gap-2">
            <input
              id="share-url-input"
              type="text"
              value={shareUrl}
              readOnly
              className={`flex-1 min-w-[400px] px-3 py-2 rounded-lg text-sm font-mono ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-white text-slate-900 border-slate-300'
              } border`}
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                linkCopied
                  ? isDarkMode
                    ? 'bg-green-700 text-white'
                    : 'bg-green-600 text-white'
                  : isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
              }`}
            >
              {linkCopied ? (
                <span className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Copied!
                </span>
              ) : (
                'Copy Link'
              )}
            </button>
          </div>

          {/* Partial Failure Details */}
          {partialFailures.length > 0 && (
            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>Some favicons failed to upload but the share link was created with the successful ones.</p>
            </div>
          )}

          {/* Create New Link - Only show if favicons changed */}
          {faviconsChanged && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              isDarkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  Favicons updated
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400/80' : 'text-blue-700'}`}>
                  Create a new link to share the updated preview.
                </p>
                <button
                  onClick={() => {
                    setShareState('idle');
                    setShareUrl('');
                    setPartialFailures([]);
                    setLinkCopied(false);
                  }}
                  className={`mt-2 text-sm font-medium underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}
                >
                  Create New Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {shareState === 'error' && (
        <div className="space-y-2">
          <div className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Failed to create share link
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {errorMessage}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
              }`}
            >
              Retry
            </button>
            <button
              onClick={() => setShareState('idle')}
              className={`text-sm underline ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-700'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
