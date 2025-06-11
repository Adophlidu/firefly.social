import 'tippy.js/dist/tippy.css';

import {
    arrow,
    autoUpdate,
    flip,
    FloatingArrow,
    offset,
    type Placement,
    safePolygon,
    useClick,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
} from '@floating-ui/react';
import type { TippyProps } from '@tippyjs/react';
import { memo, type ReactElement, type ReactNode, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { Tippy } from '@/esm/Tippy.js';
import { classNames } from '@/helpers/classNames.js';

export interface TooltipProps {
    content: ReactNode;
    /**
     * @deprecated
     * Use old implementation. If you found you need this, contact @Jack-Works.
     */
    old?: boolean;
    /** Enable the tooltip on mobile devices */
    touch?: boolean;
    placement?: TippyProps['placement'] & Placement;
    /** Expand the hover area to the tooltip, so content in the tooltip can be interactive */
    interactive?: boolean;
    hideOnClick?: boolean;
    disabled?: boolean;
    children: ReactElement;
    className?: string;
    /** Only used in storybook. */
    open?: boolean;
}

export const Tooltip = memo<TooltipProps>(function Tooltip(props) {
    const { children, content, placement = 'right', old = true, ...rest } = props;
    // disable tooltips on mobile devices
    if (IS_MOBILE_DEVICE && !props.touch) return children;
    if (!content) return children;

    if (!old) return <NewTooltip {...props} />;

    return (
        <Tippy
            placement={placement}
            duration={0}
            delay={[0, 0]}
            content={<span>{content}</span>}
            trigger="mouseenter"
            {...rest}
            className={classNames('hidden !rounded-lg !text-xs !leading-6 tracking-wide sm:block', props.className)}
        >
            {children}
        </Tippy>
    );
});

const NewTooltip = memo<TooltipProps>(function NewTooltip(props) {
    const arrowRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const { placement, interactive, disabled, content, open, hideOnClick } = props;
    const ARROW_HEIGHT = 5;
    const GAP = 5;
    const { refs, floatingStyles, context } = useFloating({
        placement,
        open: !disabled && isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [offset(ARROW_HEIGHT + GAP), arrow({ element: arrowRef, padding: 8 }), flip()],
    });
    const dismiss = useDismiss(context);
    const click = useClick(context, {
        enabled: hideOnClick,
        stickIfOpen: false,
    });
    const hover = useHover(context, {
        enabled: !disabled,
        handleClose: interactive ? safePolygon({}) : null,
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss]);

    const floating =
        isOpen || open ? (
            <div
                data-floating-root
                ref={refs.setFloating}
                {...getFloatingProps()}
                style={floatingStyles}
                className="floating-box !rounded-lg !text-xs !leading-6 tracking-wide sm:block"
            >
                <div className="floating-content">{content}</div>
                <FloatingArrow ref={arrowRef} context={context} fill="#333" />
            </div>
        ) : undefined;
    return (
        <span ref={refs.setReference} {...getReferenceProps()}>
            {props.children}
            {interactive ? floating : createPortal(floating, document.body)}
        </span>
    );
});
