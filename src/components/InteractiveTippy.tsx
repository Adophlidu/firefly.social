import {
    autoUpdate,
    flip,
    offset,
    type OpenChangeReason,
    type Placement,
    safePolygon,
    useClick,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
    useTransitionStyles,
} from '@floating-ui/react';
import type { TippyProps } from '@tippyjs/react';
import { memo, useState } from 'react';
import { createPortal } from 'react-dom';

import { Tippy } from '@/esm/Tippy.js';

export interface InteractiveTippyProps {
    /**
     * TODO: rename to open.
     *
     * If this prop is set, this component act as controlled.
     */
    visible?: boolean;
    onOpenChange?(open: boolean, event?: Event, reason?: OpenChangeReason): void;
    /**
     * TODO: remove and use onOpenChange
     */
    onClickOutside?: () => void;
    /**
     * TODO: remove and use onOpenChange
     */
    onTrigger?: TippyProps['onTrigger'];
    /**
     * TODO: remove and use onOpenChange
     */
    onShow?: TippyProps['onShow'];
    /**
     * TODO: remove and use onOpenChange
     */
    onHidden?: TippyProps['onHidden'];
    children: TippyProps['children'];
    appendTo?: Element | 'parent' | (() => Element) | undefined;
    className?: string;
    maxWidth?: TippyProps['maxWidth'];
    offset?: [number, number];
    placement?: TippyProps['placement'] & Placement;
    /**
     * TODO: change the shape to @floating-ui style
     */
    delay?: TippyProps['delay'];
    content?: TippyProps['content'];
    disabled?: TippyProps['disabled'];
    trigger?: 'click' | 'mouseenter focus';
    /**
     * @deprecated A "InteractiveTippy" should not be set interactive: false
     */
    interactive?: TippyProps['interactive'];
    old?: boolean;
}
export const InteractiveTippy = memo<InteractiveTippyProps>(function InteractiveTippy({ old = true, ...rest }) {
    if (!old) return <NewTooltip {...rest} />;
    return (
        <Tippy
            appendTo={() => document.body}
            duration={300}
            delay={1000}
            arrow={false}
            trigger="mouseenter"
            hideOnClick
            interactive
            {...rest}
        />
    );
});

const NewTooltip = memo<InteractiveTippyProps>(function NewTooltip(props) {
    const {
        placement,
        interactive = true,
        disabled,
        content,
        children,
        className,
        delay = 1000,
        maxWidth,
        offset: propOffset,
        onOpenChange,
        trigger,
        visible: propOpen,
    } = props;
    let { appendTo } = props;
    if (!appendTo) {
        appendTo = interactive ? undefined : document.body;
    }

    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const open = !disabled && (propOpen === undefined ? uncontrolledOpen : propOpen);
    const { refs, floatingStyles, context } = useFloating({
        placement,
        open,
        onOpenChange: (open, event, reason) => {
            setUncontrolledOpen(open);
            onOpenChange?.(open, event, reason);
        },
        whileElementsMounted: autoUpdate,
        middleware: [offset(propOffset ? { mainAxis: propOffset[1], crossAxis: propOffset[0] } : 5), flip()],
    });
    const dismiss = useDismiss(context);
    const click = useClick(context, {
        stickIfOpen: false,
    });
    const hover = useHover(context, {
        enabled: !disabled && trigger !== 'click',
        handleClose: interactive ? safePolygon({}) : null,
        delay:
            typeof delay === 'number'
                ? delay
                : typeof delay === 'object'
                  ? { open: delay[0] || undefined, close: delay[1] || undefined }
                  : 0,
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss]);
    const { isMounted, styles } = useTransitionStyles(context, { duration: 300 });

    const floating = isMounted ? (
        <div
            data-floating-root
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, ...styles, maxWidth }}
            className="floating-box !rounded-xs sm:block"
        >
            <div className="floating-content">{content}</div>
        </div>
    ) : undefined;
    return (
        <span className={className} ref={refs.setReference} {...getReferenceProps()}>
            {children}
            {typeof appendTo === 'function'
                ? createPortal(floating, appendTo())
                : typeof appendTo === 'object'
                  ? createPortal(floating, appendTo)
                  : floating}
        </span>
    );
});
