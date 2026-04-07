import { TooltipContent } from '@radix-ui/react-tooltip';
import { cloneElement, memo, type ReactElement, type ReactNode } from 'react';

import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip.js';
import { useDetectOverflow } from '@/hooks/useDetectOverflow.js';

interface TextOverflowTooltipProps {
    content: ReactNode;
    children: ReactElement<any>;
}

export const TextOverflowTooltip = memo(function TextOverflowTooltip({ children, content }: TextOverflowTooltipProps) {
    const [overflow, ref] = useDetectOverflow();
    return (
        <Tooltip>
            <TooltipTrigger>
                {cloneElement(children, {
                    ...children.props,
                    ref,
                    'data-overflow': overflow,
                })}
            </TooltipTrigger>
            <TooltipContent>{content}</TooltipContent>
        </Tooltip>
    );
});
