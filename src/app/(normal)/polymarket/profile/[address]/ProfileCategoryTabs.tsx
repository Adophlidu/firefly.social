'use client';

import { Trans } from '@lingui/react/macro';
import { redirect, useSelectedLayoutSegments } from 'next/navigation.js';

import { SourceTabs } from '@/components/SourceTabs/index.js';
import { SourceTab } from '@/components/SourceTabs/SourceTab.js';

enum Category {
    Positions = 'positions',
    Trades = 'trades',
}
const categories = [
    { tab: Category.Positions, label: <Trans>Positions</Trans> },
    { tab: Category.Trades, label: <Trans>Trades</Trans> },
];

export function ProfileCategoryTabs({ address }: { address: string }) {
    const segments = useSelectedLayoutSegments();
    const selected = segments.length > 0 ? segments[0] : Category.Positions;

    if (!categories.find((x) => x.tab === selected)) {
        redirect('/polymarket/profile/' + address);
    }

    return (
        <SourceTabs>
            {categories.map((category) => (
                <SourceTab
                    key={category.tab}
                    isActive={category.tab === selected}
                    href={`/polymarket/profile/${address}/${category.tab}`}
                >
                    {category.label}
                </SourceTab>
            ))}
        </SourceTabs>
    );
}
