'use client';

import {
    arrow,
    autoUpdate,
    flip,
    FloatingArrow,
    offset,
    type Placement,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
    useTransitionStyles,
} from '@floating-ui/react';
import type { TippyProps } from '@tippyjs/react';
import { cloneElement, memo, type ReactElement, type ReactNode, useRef, useState } from 'react';

import { Tippy } from '@/esm/Tippy.js';
import { classNames } from '@/helpers/classNames.js';
import { useDetectOverflow } from '@/hooks/useDetectOverflow.js';

interface TextOverflowTooltipProps {
    content: ReactNode;
    children: ReactElement<any>;
    placement?: TippyProps['placement'] & Placement;
    className?: string;
    old?: boolean;
    open?: boolean;
}

export const TextOverflowTooltip = memo(function TextOverflowTooltip(props: TextOverflowTooltipProps) {
    const { children, className, old = true, open, ...rest } = props;
    const [overflow, ref] = useDetectOverflow();
    if (!old) return <NewTooltip {...props} />;
    return (
        <Tippy
            className={classNames(
                'hidden !rounded-lg !text-xs !leading-6 tracking-wide',
                overflow ? 'sm:block' : 'hidden',
                className,
            )}
            // disable tooltip by setting very large delay.
            delay={overflow ? [0, 0] : [1000_000_000, 0]}
            {...rest}
        >
            {cloneElement(children, { ...children.props, ref, 'data-overflow': overflow })}
        </Tippy>
    );
});

const NewTooltip = memo<TextOverflowTooltipProps>(function NewTooltip(props) {
    const { placement, content, children } = props;
    const [overflow, ref] = useDetectOverflow();
    const arrowRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const ARROW_HEIGHT = 5;
    const GAP = 5;
    const open = (isOpen && overflow) || props.open;
    const { refs, floatingStyles, context } = useFloating({
        placement,
        open,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [offset(ARROW_HEIGHT + GAP), arrow({ element: arrowRef, padding: 8 }), flip()],
    });
    const { isMounted, styles } = useTransitionStyles(context);
    const dismiss = useDismiss(context);
    const hover = useHover(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss]);

    return (
        <>
            <span ref={refs.setReference} {...getReferenceProps()}>
                {cloneElement(children, { ...children.props, ref, 'data-overflow': overflow })}
                {isMounted ? (
                    <div
                        data-floating-root
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        style={{ ...floatingStyles, ...styles }}
                        className="floating-box !rounded-lg !text-xs !leading-6 tracking-wide"
                    >
                        <div className="floating-content">{content}</div>
                        <FloatingArrow ref={arrowRef} context={context} fill="#333" />
                    </div>
                ) : undefined}
            </span>
        </>
    );
});
