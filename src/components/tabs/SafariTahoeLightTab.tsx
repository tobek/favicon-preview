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
        transition-all cursor-pointer backdrop-blur-sm
      `}
    >
      <img
        src={favicon}
        alt={title}
        className="w-4 h-4 flex-shrink-0"
      />
      {!isCollapsed && (
        <div className="flex-1 relative overflow-hidden">
          <span className="text-[#1d1d1f] text-[11px] whitespace-nowrap select-none font-medium">
            {title}
          </span>
          <div className="absolute top-0 right-0 bottom-0 w-6 pointer-events-none" style={{
            background: isActive
              ? 'linear-gradient(to left, rgba(255, 255, 255, 0.9), transparent)'
              : 'linear-gradient(to left, rgba(245, 245, 247, 0.7), transparent)'
          }}></div>
        </div>
      )}
    </div>
  );
}
