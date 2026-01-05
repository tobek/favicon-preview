import type { TabProps } from "../../types.ts";

interface ChromeColorTabProps extends TabProps {
  bgColor?: string;
}

// Helper function to determine if light text should be used
function shouldUseLightText(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return true;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function ChromeColorTab({
  favicon,
  title,
  isActive = false,
  isCollapsed = false,
  bgColor = "#3f6a64",
  onClick
}: ChromeColorTabProps) {
  // Active tab is lighter, inactive is darker
  const activeBg = bgColor;
  const inactiveBg = `color-mix(in srgb, ${bgColor} 70%, black)`;

  // Determine text color based on background
  const useLightText = shouldUseLightText(bgColor);
  const textColor = useLightText ? 'white' : 'black';
  const closeButtonColor = useLightText ? 'white' : 'black';

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center h-[34px] rounded-t-[8px] flex-shrink-0
        ${isCollapsed ? "w-[46px] justify-center px-0" : "w-[180px] px-3"}
        transition-all cursor-pointer group relative
      `}
      style={{
        backgroundColor: isActive ? activeBg : inactiveBg,
      }}
    >
      <img
        src={favicon}
        alt={title}
        className={`w-4 h-4 flex-shrink-0 object-contain ${!isCollapsed && 'mr-2'}`}
      />
      {!isCollapsed && (
        <>
          <span
            className="flex-1 text-[12px] whitespace-nowrap select-none overflow-hidden"
            style={{
              color: textColor,
              maskImage: 'linear-gradient(to right, black 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent 100%)'
            }}
          >
            {title}
          </span>
          <button
            className={`w-[18px] h-[18px] flex-shrink-0 rounded flex items-center justify-center transition-colors self-center ${
              useLightText ? 'hover:bg-white/20' : 'hover:bg-black/20'
            }`}
            aria-label="Close tab"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="mt-[1px]">
              <path
                d="M1 1L7 7M1 7L7 1"
                stroke={closeButtonColor}
                strokeOpacity="0.8"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
