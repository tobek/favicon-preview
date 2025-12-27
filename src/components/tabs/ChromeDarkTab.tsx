import type { TabProps } from "../../types.ts";

export function ChromeDarkTab({ favicon, title, isActive = false, isCollapsed = false, onClick }: TabProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center h-[34px] rounded-t-[8px] flex-shrink-0
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
        className={`w-4 h-4 flex-shrink-0 ${!isCollapsed && 'mr-2'}`}
      />
      {!isCollapsed && (
        <>
          <span
            className="flex-1 text-[#e8eaed] text-[12px] whitespace-nowrap select-none overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)'
            }}
          >
            {title}
          </span>
          <button
            className="w-[18px] h-[18px] flex-shrink-0 hover:bg-[#5f6368] rounded flex items-center justify-center transition-colors self-center"
            aria-label="Close tab"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="mt-[1px]">
              <path d="M1 1L7 7M1 7L7 1" stroke="#9aa0a6" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
