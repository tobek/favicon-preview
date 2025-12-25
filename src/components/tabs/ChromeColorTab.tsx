import type { TabProps } from "../../types.ts";

interface ChromeColorTabProps extends TabProps {
  bgColor?: string;
}

export function ChromeColorTab({
  favicon,
  title,
  isActive = false,
  isCollapsed = false,
  bgColor = "#3f6a64"
}: ChromeColorTabProps) {
  // Active tab is lighter, inactive is darker
  const activeBg = bgColor;
  const inactiveBg = `color-mix(in srgb, ${bgColor} 70%, black)`;

  return (
    <div
      className={`
        flex items-center gap-2 h-[34px] rounded-t-[8px] flex-shrink-0
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
        className="w-4 h-4 flex-shrink-0"
      />
      {!isCollapsed && (
        <>
          <span className="text-white text-[12px] truncate flex-1 select-none">
            {title}
          </span>
          <button
            className="w-[18px] h-[18px] flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded flex items-center justify-center transition-opacity"
            aria-label="Close tab"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1L7 7M1 7L7 1" stroke="white" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
