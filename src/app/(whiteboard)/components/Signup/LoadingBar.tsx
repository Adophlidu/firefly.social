import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';
import { useMount } from 'react-use';

const spinSpanPositions = [
    { right: 0, top: 0 },
    { right: 0, top: 5 },
    { right: 0, top: 11 },
    { right: 0, bottom: 0 },
    { right: 3, top: 2 },
    { right: 3, top: 8 },
    { right: 3, top: 13 },
    { right: 6, top: 6 },
    { right: 6, bottom: 1 },
    { right: 8, bottom: 6 },
    { right: 10, top: 6 },
    { right: 12, top: 0 },
    { right: 16, top: 8 },
    { right: 21, top: 3 },
    { right: 27, bottom: 4 },
];

export const LoadingBar = memo(function LoadingBar() {
    const [rate, setRate] = useState(0);

    useMount(() => {
        const interval = setInterval(() => {
            setRate((prev) => {
                if (prev >= 98) {
                    clearInterval(interval);
                    return 98; // Stop at 98% to avoid going over 100%
                }

                let increment = 10;
                if (prev > 50) {
                    increment = 5; // Slow down the increment after 50%
                } else if (prev > 70) {
                    increment = 2; // Slow down further after 70%
                } else if (prev > 80) {
                    increment = 1; // Slow down even further after 80%
                }

                return Math.min(prev + Math.random() * increment, 98); // Ensure we don't exceed 98%
            });
        }, 500); // Update every 500ms

        return () => clearInterval(interval);
    });

    return (
        <div className="flex size-full flex-col items-center justify-center gap-6">
            <div className="h-[22px] w-[240px] overflow-hidden border-2 border-[#5E69FF]">
                <div
                    className="relative h-full bg-[#5E69FF]"
                    style={{
                        width: `${rate}%`,
                        transition: 'width 0.5s ease-in-out',
                    }}
                >
                    {spinSpanPositions.map((pos, index) => (
                        <span
                            key={index}
                            className="absolute inline-block size-0.5 bg-white"
                            style={{
                                right: pos.right,
                                top: pos.top,
                                bottom: pos.bottom,
                            }}
                        />
                    ))}
                </div>
            </div>
            <span className="text-base font-semibold text-[#171717]">
                <Trans>Generating</Trans>
                <span className="loading-text inline-block w-4" />
            </span>
        </div>
    );
});
