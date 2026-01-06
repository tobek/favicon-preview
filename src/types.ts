export interface TabProps {
  favicon: string;
  title: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export interface UploadedFavicon {
  id: string;
  dataUrl: string;
  title: string;
}

// Extended UploadedFavicon with compression and upload state
export interface CompressedFavicon extends UploadedFavicon {
  compressedDataUrl?: string;   // Compressed version for upload
  uploadedImageUrl?: string;     // ImageKit URL after upload
  uploadError?: string;          // Upload error message
}

// Shared state structure (internal representation)
export interface SharedState {
  favicons: Array<{
    url: string;    // ImageKit hosted URL
    title: string;
  }>;
  color: string;    // Hex without #
  version: number;  // Schema version
}

// ImageKit API response
export interface ImageKitResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
  filePath: string;
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
}
