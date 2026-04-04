'use client';

import { classNames } from '@dimensiondev/utils';
import { type TippyProps } from '@tippyjs/react';
import { cloneElement, memo, type ReactElement, type ReactNode } from 'react';

import { Tippy } from '@/esm/Tippy.js';
import { useDetectOverflow } from '@/hooks/useDetectOverflow.js';

interface TextOverflowTooltipProps extends Omit<TippyProps, 'ref' | 'title' | 'children'> {
    withDelay?: boolean;
    content: ReactNode;

    children: ReactElement<any>;
}

export const TextOverflowTooltip = memo(function TextOverflowTooltip({
    children,
    withDelay,
    className,
    ...rest
}: TextOverflowTooltipProps) {
    const [overflow, ref] = useDetectOverflow();
    return (
        <Tippy
            className={classNames(
                'hidden !rounded-lg !text-xs !leading-6 tracking-wide',
                overflow ? 'sm:block' : 'hidden',
                className,
            )}
            // disable tooltip by setting very large delay.
            delay={overflow ? [withDelay ? 500 : 0, 0] : [1000_000_000, 0]}
            {...rest}
        >
            {cloneElement(children, { ...children.props, ref, 'data-overflow': overflow })}
        </Tippy>
    );
});
