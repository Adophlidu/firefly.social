import { classNames } from '@dimensiondev/utils';
import { type ReactNode } from 'react';

import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { Tooltip } from '@/components/Tooltip.js';

interface InfoCardProps extends Omit<React.HTMLProps<HTMLDivElement>, 'title' | 'value'> {
    title: ReactNode;
    value: ReactNode;
    description?: ReactNode;
}

export function InfoCard({ title, value, description, className }: InfoCardProps) {
    return (
        <div
            className={classNames(
                'bg-lightBg flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-3 py-4',
                className,
            )}
        >
            <TextOverflowTooltip content={value}>
                <div className="text-main w-full truncate text-center text-base font-bold leading-5">
                    {value || '-'}
                </div>
            </TextOverflowTooltip>
            {description ? (
                <Tooltip content={<div className="max-w-[260px]">{description}</div>} placement="bottom">
                    <span className="text-second cursor-help text-[13px] leading-[18px] hover:underline">{title}</span>
                </Tooltip>
            ) : (
                <span className="text-second text-[13px] leading-[18px]">{title}</span>
            )}
        </div>
    );
}
