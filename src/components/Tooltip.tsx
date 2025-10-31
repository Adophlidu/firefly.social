import '@/assets/css/tippy.css';

import { classNames } from '@firefly/utils';
import type { TippyProps } from '@tippyjs/react';
import { memo, type ReactNode } from 'react';

import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { Tippy } from '@/esm/Tippy.js';

interface TooltipProps extends TippyProps {
    content: ReactNode;
    withDelay?: boolean;
}

export const Tooltip = memo<TooltipProps>(function Tooltip({
    children,
    content,
    placement = 'right',
    withDelay = false,
    ...props
}) {
    // disable tooltips on mobile devices
    if (IS_MOBILE_DEVICE && !props.touch) return children;
    if (!content) return children;

    return (
        <Tippy
            placement={placement}
            duration={0}
            delay={[withDelay ? 500 : 0, 0]}
            content={<span>{content}</span>}
            trigger="mouseenter"
            {...props}
            className={classNames('hidden !rounded-lg !text-xs !leading-6 tracking-wide sm:block', props.className)}
        >
            {children}
        </Tippy>
    );
});
