import { useRef, useState, type ReactNode } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  safePolygon,
  FloatingPortal,
  FloatingArrow,
} from '@floating-ui/react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
  open?: boolean;
  wide?: boolean;
  interactive?: boolean;
}

const ARROW_HEIGHT = 6;
// Visible gap between the arrow tip and the trigger.
const GAP = 4;

export function Tooltip({ content, children, className, position = 'top', open, wide, interactive }: TooltipProps) {
  const controlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlled ? open : uncontrolledOpen;

  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: position,
    open: isOpen,
    onOpenChange: setUncontrolledOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(ARROW_HEIGHT + GAP),
      // Flip only on the main axis (top<->bottom) when vertical room runs out.
      // crossAxis:false ignores horizontal overflow so a wide tooltip on an edge
      // tile stays on top instead of jumping to the left/right side.
      flip({ crossAxis: false }),
      // Slide horizontally to stay within the viewport (fixes offscreen edges).
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  // Uncontrolled tooltips open on hover/focus; controlled ones are driven by `open`.
  const hover = useHover(context, {
    enabled: !controlled,
    move: false,
    // Let the pointer travel into interactive bubbles without dismissing.
    handleClose: interactive ? safePolygon() : null,
  });
  const focus = useFocus(context, { enabled: !controlled });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, { duration: 150 });

  const sizing = wide
    ? 'w-72 whitespace-normal text-left px-3 py-2'
    : 'whitespace-nowrap px-2.5 py-1.5';

  return (
    <>
      <div
        ref={refs.setReference}
        className={`items-center ${className ? className : 'inline-flex'}`}
        {...getReferenceProps()}
      >
        {children}
      </div>
      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={`z-50 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
            {...getFloatingProps()}
          >
            <div
              style={transitionStyles}
              className={`relative ${sizing} bg-slate-700 text-slate-50 text-sm rounded-md ring-1 ring-slate-500/40 shadow-lg`}
            >
              {content}
              <FloatingArrow ref={arrowRef} context={context} width={12} height={ARROW_HEIGHT} fill="#334155" />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
