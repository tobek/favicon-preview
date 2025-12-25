import type { TabProps } from "../../types.ts";

export function ChromeLightTab({ favicon, title, isActive = false, isCollapsed = false, onClick }: TabProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 h-[34px] rounded-t-[8px] flex-shrink-0
        ${isActive
          ? "bg-white"
          : "bg-[#dee1e6] hover:bg-[#d3d6db]"
        }
        ${isCollapsed ? "w-[46px] justify-center px-0" : "w-[180px] px-3"}
        transition-all cursor-pointer group relative
      `}
    >
      <img
        src={favicon}
        alt={title}
        className="w-4 h-4 flex-shrink-0"
      />
      {!isCollapsed && (
        <>
          <div className="flex-1 relative overflow-hidden">
            <span className="text-[#202124] text-[12px] whitespace-nowrap select-none">
              {title}
            </span>
            {/* Gradient for normal state */}
            <div
              className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none transition-opacity group-hover:opacity-0"
              style={{
                background: isActive ? 'linear-gradient(to left, white, transparent)' : 'linear-gradient(to left, #dee1e6, transparent)'
              }}
            ></div>
            {/* Gradient for hover state */}
            <div
              className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
              style={{
                background: isActive ? 'linear-gradient(to left, white, transparent)' : 'linear-gradient(to left, #d3d6db, transparent)'
              }}
            ></div>
          </div>
          <button
            className="w-[18px] h-[18px] flex-shrink-0 hover:bg-[#c4c7cc] rounded flex items-center justify-center transition-colors"
            aria-label="Close tab"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1L7 7M1 7L7 1" stroke="#5f6368" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
