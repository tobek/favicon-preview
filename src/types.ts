export interface TabProps {
  favicon: string;
  title: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

export interface UploadedFavicon {
  id: string;
  dataUrl: string;
  title: string;
}

// Extended UploadedFavicon with compression and upload state
export interface CompressedFavicon extends UploadedFavicon {
  compressedDataUrl?: string;   // Compressed version for upload
  uploadedImageUrl?: string;     // Firebase Storage URL after upload
  uploadError?: string;          // Upload error message
}

// Shared state structure (internal representation)
export interface SharedState {
  favicons: Array<{
    url: string;    // Firebase Storage URL
    title: string;
  }>;
  color: string;    // Hex without #
  version: number;  // Schema version
  closedDummyTabs?: number[];  // Indices of closed dummy tabs
}

// Firestore shortlink document structure
export interface ShortlinkDocument {
  id: string;
  favicons: Array<{
    url: string;
    title: string;
  }>;
  color: string;       // Hex without #
  version: number;
  createdAt: number;   // Timestamp
  closedDummyTabs?: number[];
}
