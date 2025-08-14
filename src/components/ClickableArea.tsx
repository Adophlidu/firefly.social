'use client';

import { createElement, type HTMLProps, type JSX, type MouseEvent } from 'react';

interface ClickableAreaProps extends HTMLProps<HTMLDivElement> {
    disabled?: boolean;
    as?: keyof JSX.IntrinsicElements;
}

export function ClickableArea({ as = 'div', children, ref, ...props }: ClickableAreaProps) {
    return createElement(
        as,
        {
            ...props,
            ref,
            onClick: (ev: MouseEvent<HTMLDivElement>) => {
                ev.preventDefault();
                ev.stopPropagation();

                if (props.disabled) return;
                props.onClick?.(ev);
            },
        },
        children,
    );
}
