import type { TabProps } from "../../types.ts";

export function SafariTahoeLightTab({ favicon, title, isActive = false, isCollapsed = false, onClick }: TabProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 h-[28px] rounded-[6px] flex-shrink-0
        ${isActive
          ? "bg-white/90 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.05)]"
          : "bg-[#f5f5f7]/70 hover:bg-white/60"
        }
        ${isCollapsed ? "w-[36px] justify-center px-0" : "w-[160px] px-2.5"}
        transition-all cursor-pointer backdrop-blur-sm group
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
            <span className="text-[#1d1d1f] text-[11px] whitespace-nowrap select-none font-medium">
              {title}
            </span>
            {/* Gradient for normal state */}
            <div
              className="absolute top-0 right-0 bottom-0 w-6 pointer-events-none transition-opacity group-hover:opacity-0"
              style={{
                background: isActive
                  ? 'linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent)'
                  : 'linear-gradient(to left, rgba(245, 245, 247, 0.7), transparent)'
              }}
            ></div>
            {/* Gradient for hover state */}
            <div
              className="absolute top-0 right-0 bottom-0 w-6 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100"
              style={{
                background: isActive
                  ? 'linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent)'
                  : 'linear-gradient(to left, rgba(255, 255, 255, 0.6), transparent)'
              }}
            ></div>
          </div>
          <button
            className="w-[16px] h-[16px] flex-shrink-0 hover:bg-black/10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 self-center"
            aria-label="Close tab"
          >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <path d="M1 1L6 6M1 6L6 1" stroke="#1d1d1f" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
