import { useState, useEffect, useRef } from 'react';
import type { CompressedFavicon } from '../types';
import {
  uploadMultipleToFirebase,
  hasFirebaseConfig,
} from '../utils/firebaseUpload';
import { createShortlink } from '../utils/shortlink';
import { Tooltip } from './Tooltip';

interface ShareButtonProps {
  uploadedFavicons: CompressedFavicon[];
  chromeColorTheme: string;
  isDarkMode: boolean;
  faviconsModified: boolean;
  isSharedPreview: boolean;
  closedDummyTabIndices: number[];
  onShareSuccess: () => void;
}

type ShareState = 'idle' | 'uploading' | 'success' | 'error';

// True when the primary input can't hover (e.g. phones/tablets). Don't use
// touch-point detection here: desktop machines with touchscreens or certain
// input drivers report touch support but still hover fine.
function hasNoHover(): boolean {
  return typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches;
}

const ARCHIVE_TOOLTIP = (
  <>
    Share your favicons with the world 🌌{' '}
    <a
      href="/archive"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="underline hover:text-white"
    >
      The archive
    </a>{' '}
    is a public gallery: your favicons and any titles/filenames will be visible.
  </>
);

interface ArchiveButtonProps {
  isDarkMode: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onArchive: () => void;
}

// Secondary "Add to Favicon Archive" button. When the primary input can't
// hover (no way to surface the disclosure tooltip), the first tap opens the
// tooltip and arms the button as "Confirm Add to Archive"; the second tap shares.
function ArchiveButton({ isDarkMode, disabled, disabledReason, onArchive }: ArchiveButtonProps) {
  const [armed, setArmed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const noHover = hasNoHover();

  // Tapping anywhere else disarms the confirm state
  useEffect(() => {
    if (!armed) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setArmed(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [armed]);

  const handleClick = () => {
    if (disabled) return;
    if (noHover && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onArchive();
  };

  return (
    <div ref={wrapperRef} className="inline-flex">
      <Tooltip
        wide={!disabled}
        interactive
        open={noHover ? armed : undefined}
        content={disabled ? disabledReason : ARCHIVE_TOOLTIP}
      >
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            disabled
              ? isDarkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-300 text-slate-500 cursor-not-allowed'
              : isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
          }`}
        >
          {armed ? 'Confirm Add to Archive' : 'Add to Favicon Archive'}
        </button>
      </Tooltip>
    </div>
  );
}

export function ShareButton({ uploadedFavicons, chromeColorTheme, isDarkMode, faviconsModified, isSharedPreview, closedDummyTabIndices, onShareSuccess }: ShareButtonProps) {
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [partialFailures, setPartialFailures] = useState<Array<{ id: string; error: string }>>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [archiveSaveState, setArchiveSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const linkCopiedTimeoutRef = useRef<number | null>(null);
  const isPublicRef = useRef(false);
  // Storage URLs from previous uploads, keyed by favicon id, so sharing again
  // (or archiving after sharing) never re-uploads the same image
  const uploadCacheRef = useRef<Map<string, string>>(new Map());
  // Snapshot of what the current shortlink contains, for archiving it afterwards
  const sharedSnapshotRef = useRef<{
    favicons: CompressedFavicon[];
    color: string;
    closedDummyTabs: number[];
  } | null>(null);

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

  const handleShare = async (isPublic: boolean) => {
    if (!canShare) return;
    isPublicRef.current = isPublic;

    setShareState('uploading');
    setErrorMessage('');
    setPartialFailures([]);

    if (!hasFirebaseConfig()) {
      setErrorMessage('Firebase not configured. Please check src/config/firebase.config.ts');
      setShareState('error');
      return;
    }

    try {
      // Upload images to Firebase Storage, skipping favicons that already
      // have a storage URL (loaded from a shared link or uploaded previously)
      const cache = uploadCacheRef.current;
      const imagesToUpload = uploadedFavicons
        .filter((favicon) => !favicon.uploadedImageUrl && !cache.has(favicon.id))
        .map((favicon) => ({
          id: favicon.id,
          compressedDataUrl: favicon.compressedDataUrl || favicon.dataUrl,
          fileName: `${favicon.title}.png`,
        }));

      setUploadProgress({ completed: 0, total: imagesToUpload.length });

      const uploadResults = imagesToUpload.length > 0
        ? await uploadMultipleToFirebase(imagesToUpload)
        : [];

      // Update progress as complete
      setUploadProgress({ completed: imagesToUpload.length, total: imagesToUpload.length });

      uploadResults.forEach((result) => {
        if (result.url) cache.set(result.id, result.url);
      });

      // Check for failures
      const failures = uploadResults.filter((result) => result.error !== null);

      if (failures.length > 0) {
        setPartialFailures(
          failures.map((f) => ({
            id: f.id,
            error: f.error || 'Unknown error',
          }))
        );
      }

      // Resolve favicons to their storage URLs for shortlink creation
      const uploadedFaviconsWithUrls = uploadedFavicons.map(f => ({
        ...f,
        uploadedImageUrl: f.uploadedImageUrl || cache.get(f.id)
      })).filter(f => f.uploadedImageUrl); // Only include favicons with a storage URL

      if (uploadedFaviconsWithUrls.length === 0) {
        setErrorMessage('All uploads failed. Please check your network connection and try again.');
        setShareState('error');
        return;
      }

      // Create shortlink
      const shortId = await createShortlink(uploadedFaviconsWithUrls, chromeColorTheme, closedDummyTabIndices, isPublic);

      if (!shortId) {
        setErrorMessage('Failed to create share link. Please try again.');
        setShareState('error');
        return;
      }

      sharedSnapshotRef.current = {
        favicons: uploadedFaviconsWithUrls,
        color: chromeColorTheme,
        closedDummyTabs: closedDummyTabIndices,
      };
      const url = `${window.location.origin}/?s=${shortId}`;
      setShareUrl(url);
      setIsArchived(isPublic);
      setArchiveSaveState('idle');
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
      }, 2000) as unknown as number;
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

  // Archive an already-shared preview. Client updates are denied by Firestore
  // rules, so this creates a second, public shortlink doc reusing the
  // already-uploaded image URLs (no image re-upload).
  const handleArchiveExisting = async () => {
    const snapshot = sharedSnapshotRef.current;
    if (!snapshot) return;

    setArchiveSaveState('saving');
    const shortId = await createShortlink(snapshot.favicons, snapshot.color, snapshot.closedDummyTabs, true);
    if (shortId) {
      setIsArchived(true);
      setArchiveSaveState('idle');
    } else {
      setArchiveSaveState('error');
    }
  };

  const handleRetry = () => {
    setShareState('idle');
    setErrorMessage('');
    setPartialFailures([]);
    handleShare(isPublicRef.current);
  };

  if (!hasCredentials) {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
        <p>Firebase not configured</p>
        <p className="text-xs mt-1">
          Check src/config/firebase.config.ts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Share Buttons */}
      {shareState === 'idle' && (
        <div className="flex items-center justify-center gap-3">
          <Tooltip
            wide={canShare}
            content={canShare
              ? 'Create a private link to this preview that you can share, visible only to people with the link.'
              : 'Upload favicons to share them'}
          >
            <button
              onClick={() => handleShare(false)}
              disabled={!canShare}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                canShare
                  ? isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Share Preview
            </button>
          </Tooltip>
          {/* Landed on someone else's shared preview: don't offer to archive
              favicons that aren't yours. Sharing your own version first makes
              it yours (archive option appears in the success panel). */}
          {!isSharedPreview && (
            <ArchiveButton
              isDarkMode={isDarkMode}
              disabled={!canShare}
              disabledReason="Upload favicons to share them"
              onArchive={() => handleShare(true)}
            />
          )}
        </div>
      )}

      {/* Uploading State */}
      {shareState === 'uploading' && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
            <span>
              {uploadProgress.total > 0
                ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}...`
                : 'Creating share link...'}
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
                  ? 'bg-gray-800 text-gray-200 border-gray-700'
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
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
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
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              <p>Some favicons failed to upload but the share link was created with the successful ones.</p>
            </div>
          )}

          {/* Archive status: confirmation if archived, otherwise offer to archive */}
          {isArchived ? (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>
                Added to the Favicon Archive —{' '}
                <a
                  href="/archive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  view it
                </a>
              </span>
            </div>
          ) : archiveSaveState === 'saving' ? (
            <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
              <span>Adding to archive...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <ArchiveButton
                isDarkMode={isDarkMode}
                onArchive={handleArchiveExisting}
              />
              {archiveSaveState === 'error' && (
                <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  Failed to add to the archive. Please try again.
                </p>
              )}
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
                    setIsArchived(false);
                    setArchiveSaveState('idle');
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
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
            {errorMessage}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
              }`}
            >
              Retry
            </button>
            <button
              onClick={() => setShareState('idle')}
              className={`text-sm underline ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-slate-600 hover:text-slate-700'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
