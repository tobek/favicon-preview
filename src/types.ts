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
