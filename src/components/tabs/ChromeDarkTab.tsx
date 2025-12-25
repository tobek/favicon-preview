import type { TabProps } from "../../types.ts";

export function ChromeDarkTab({ favicon, title, isActive = false, isCollapsed = false }: TabProps) {
  return (
    <div
      className={`
        flex items-center gap-2 h-[34px] rounded-t-[8px] flex-shrink-0
        ${isActive
          ? "bg-[#35363a]"
          : "bg-[#292b2e] hover:bg-[#313336]"
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
          <span className="text-[#e8eaed] text-[12px] truncate flex-1 select-none">
            {title}
          </span>
          <button
            className="w-[18px] h-[18px] flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-[#5f6368] rounded flex items-center justify-center transition-opacity"
            aria-label="Close tab"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 1L7 7M1 7L7 1" stroke="#9aa0a6" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
