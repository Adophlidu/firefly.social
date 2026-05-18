'use client';

import QuestionIcon from '@dimensiondev/assets/question.svg';
import { WalletSource } from '@dimensiondev/enums';
import { AnimatePresence } from 'framer-motion';
import { memo, type ReactNode } from 'react';

import { WalletItem } from '@/app/[locale]/(settings)/components/WalletItem.js';
import { Tooltip } from '@/components/Tooltip.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface WalletGroupProps {
    title: ReactNode;
    connections: FireflyWalletConnection[];
    tooltip?: string;
    related?: boolean;
}

export const WalletGroup = memo<WalletGroupProps>(function WalletGroup({
    title,
    connections,
    tooltip,
    related = false,
}) {
    if (!connections.length) return null;

    return (
        <div className="w-full">
            <p className="text-lightMain font-bold">
                {title}
                {tooltip ? (
                    <Tooltip placement="top" content={<div className="md:!max-w-[290px]">{tooltip}</div>}>
                        <QuestionIcon className="text-second ml-1 inline-block cursor-pointer" width={18} height={18} />
                    </Tooltip>
                ) : null}
            </p>
            <div className="mt-[22px] flex w-full flex-col gap-[22px]">
                <AnimatePresence mode="wait">
                    {connections
                        .filter((c) => c.source !== WalletSource.Particle)
                        .map((connection) => (
                            <WalletItem
                                key={connection.address}
                                connection={connection}
                                noAction={!connection.canReport && related}
                            />
                        ))}
                </AnimatePresence>
            </div>
        </div>
    );
});
