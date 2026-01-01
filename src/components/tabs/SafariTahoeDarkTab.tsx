import type { TabProps } from "../../types.ts";

export function SafariTahoeDarkTab({ favicon, title, isActive = false, isCollapsed = false, onClick }: TabProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center h-[28px] rounded-[6px] flex-shrink-0
        ${isActive
          ? "bg-[#3a3a3c]/80 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.1)]"
          : "bg-[#2c2c2e]/60 hover:bg-[#3a3a3c]/50"
        }
        ${isCollapsed ? "w-[36px] justify-center px-0" : "w-[160px] px-2.5"}
        transition-all cursor-pointer backdrop-blur-sm group
      `}
    >
      <img
        src={favicon}
        alt={title}
        className={`w-4 h-4 flex-shrink-0 rounded-[2px] ${!isCollapsed && 'mr-2'}`}
      />
      {!isCollapsed && (
        <>
          <span
            className="flex-1 text-[#f5f5f7] text-[11px] whitespace-nowrap select-none font-medium overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)'
            }}
          >
            {title}
          </span>
          <button
            className="w-[16px] h-[16px] flex-shrink-0 hover:bg-white/20 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 self-center"
            aria-label="Close tab"
          >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <path d="M1 1L6 6M1 6L6 1" stroke="#f5f5f7" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
