import type { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
  open?: boolean;
  wide?: boolean;
  interactive?: boolean;
}

export function Tooltip({ content, children, className, position = 'top', open, wide, interactive }: TooltipProps) {
  const isTop = position === 'top';
  // Padding (not margin) bridges the gap to the trigger so the pointer can travel
  // into the bubble without crossing a dead zone that would dismiss it.
  const outerPosition = isTop ? 'bottom-full pb-2.5' : 'top-full pt-2.5';
  const arrowPosition = isTop
    ? 'top-full border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-700'
    : 'bottom-full border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-700';

  const visibility =
    open === undefined
      ? 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
      : open
      ? 'opacity-100 visible'
      : 'opacity-0 invisible';

  const sizing = wide
    ? 'w-72 whitespace-normal text-left px-3 py-2'
    : 'whitespace-nowrap px-2.5 py-1.5';

  return (
    <div className={`relative group items-center ${className ? className : 'inline-flex'}`}>
      {children}
      <div className={`absolute ${outerPosition} left-1/2 -translate-x-1/2 ${visibility} transition-all duration-150 z-50 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`relative ${sizing} bg-slate-700 text-slate-50 text-sm rounded-md ring-1 ring-slate-500/40 shadow-lg`}>
          {content}
          <div className={`absolute ${arrowPosition} left-1/2 -translate-x-1/2 w-0 h-0`}></div>
        </div>
      </div>
    </div>
  );
}
