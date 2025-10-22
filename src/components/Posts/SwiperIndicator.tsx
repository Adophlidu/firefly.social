import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';

interface SwiperIndicatorProps {
    activeIndex?: number;
    total: number;
    className?: string;
    onChange: (index: number) => void;
}

export const SwiperIndicator = memo<SwiperIndicatorProps>(function SwiperIndicator({
    activeIndex = 0,
    total,
    className,
    onChange,
}) {
    if (total <= 0) return null;

    return (
        <div
            className={classNames(
                'no-scrollbar flex h-8 items-center justify-center gap-1.5 overflow-x-auto',
                className,
            )}
        >
            {Array.from({ length: total }).map((_, index) => (
                <ClickableButton
                    key={index}
                    className="box-content flex h-1 w-[60px] min-w-4 py-2"
                    onClick={() => {
                        onChange(index);
                    }}
                >
                    <span className={classNames('size-full bg-highlight', activeIndex === index ? '' : 'opacity-50')} />
                </ClickableButton>
            ))}
        </div>
    );
});
