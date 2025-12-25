import type { TabProps } from "../../types.ts";

export function SafariTahoeDarkTab({ favicon, title, isActive = false, isCollapsed = false }: TabProps) {
  return (
    <div
      className={`
        flex items-center gap-2 h-[28px] rounded-[6px] flex-shrink-0
        ${isActive
          ? "bg-[#3a3a3c]/80 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.1)]"
          : "bg-[#2c2c2e]/60 hover:bg-[#3a3a3c]/50"
        }
        ${isCollapsed ? "w-[36px] justify-center px-0" : "w-[160px] px-2.5"}
        transition-all cursor-pointer backdrop-blur-sm
      `}
    >
      <img
        src={favicon}
        alt={title}
        className="w-4 h-4 flex-shrink-0"
      />
      {!isCollapsed && (
        <span className="text-[#f5f5f7] text-[11px] truncate flex-1 select-none font-medium">
          {title}
        </span>
      )}
    </div>
  );
}
