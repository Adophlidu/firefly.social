'use client';

import { useDetectOverflow } from '@dimensiondev/hooks';
import { classNames } from '@dimensiondev/utils';
import type { TippyProps } from '@tippyjs/react';
import { cloneElement, memo, type ReactElement, type ReactNode } from 'react';

import { Tippy } from '@/esm/Tippy.js';

type ChildrenRenderProps = (ref: (node: HTMLDivElement | null) => void) => ReactElement;

interface TextOverflowTooltipProps extends Omit<TippyProps, 'ref' | 'title' | 'children'> {
    withDelay?: boolean;
    content?: ReactNode;

    children: ReactElement<any> | ChildrenRenderProps;
}

export const TextOverflowTooltip = memo(function TextOverflowTooltip({
    children,
    withDelay,
    className,
    ...rest
}: TextOverflowTooltipProps) {
    const [overflow, ref] = useDetectOverflow();
    const isRenderProp = typeof children === 'function';

    return (
        <Tippy
            content={rest.content}
            className={classNames(
                'hidden !rounded-lg !text-xs !leading-6 tracking-wide',
                overflow ? 'sm:block' : 'hidden',
                className,
            )}
            // disable tooltip by setting very large delay.
            delay={overflow ? [withDelay ? 500 : 0, 0] : [1000_000_000, 0]}
            {...rest}
        >
            {isRenderProp
                ? (children as ChildrenRenderProps)(ref)
                : cloneElement(children as ReactElement, {
                      ...children.props,
                      ref,
                      'data-overflow': overflow,
                  })}
        </Tippy>
    );
});
