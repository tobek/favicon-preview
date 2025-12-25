import type { TabProps } from "../../types.ts";

export function SafariTahoeLightTab({ favicon, title, isActive = false, isCollapsed = false }: TabProps) {
  return (
    <div
      className={`
        flex items-center gap-2 h-[28px] rounded-[6px] flex-shrink-0
        ${isActive
          ? "bg-white/90 shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.05)]"
          : "bg-[#f5f5f7]/70 hover:bg-white/60"
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
        <span className="text-[#1d1d1f] text-[11px] truncate flex-1 select-none font-medium">
          {title}
        </span>
      )}
    </div>
  );
}
