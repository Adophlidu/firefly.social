'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ROUND_SEQUENCE } from '@/helpers/prediction/category/bracket/bracketView.js';
import type { BracketColumnId } from '@/helpers/prediction/category/bracket/types.js';

const ROUND_LABELS: Record<BracketColumnId, ReactNode> = {
    r32: <Trans>Round of 32</Trans>,
    r16: <Trans>Round of 16</Trans>,
    qf: <Trans>Quarterfinals</Trans>,
    sf: <Trans>Semifinals</Trans>,
    final: <Trans>Final/3rd Place</Trans>,
    champion: <Trans>Champion</Trans>,
};

interface PredictionBracketRoundTabsProps {
    activeRound: BracketColumnId;
    onSelect: (roundId: BracketColumnId) => void;
}

// Scrollable round selector; keeps the active pill centered so the next round stays visible.
export const PredictionBracketRoundTabs = memo(function PredictionBracketRoundTabs({
    activeRound,
    onSelect,
}: PredictionBracketRoundTabsProps) {
    const tabBarRef = useRef<HTMLDivElement>(null);
    const activePillRef = useRef<HTMLButtonElement>(null);

    // Center the active pill within the track (clamped so end pills stay at the edges).
    // NOTE: don't add scroll-pl-* here — it shifts scrollTo() coordinates and breaks centering.
    const centerActivePill = useCallback(() => {
        const container = tabBarRef.current;
        const pill = activePillRef.current;
        if (!container || !pill) return;
        const cRect = container.getBoundingClientRect();
        const pRect = pill.getBoundingClientRect();
        const pillCenter = pRect.left - cRect.left + container.scrollLeft + pRect.width / 2;
        const target = pillCenter - container.clientWidth / 2;
        const max = Math.max(container.scrollWidth - container.clientWidth, 0);
        container.scrollTo({ left: Math.min(Math.max(target, 0), max), behavior: 'smooth' });
    }, []);

    // Re-center as the highlight moves (before paint, no flash).
    useLayoutEffect(() => {
        centerActivePill();
    }, [activeRound, centerActivePill]);

    // Re-center on resize.
    useEffect(() => {
        const tabBar = tabBarRef.current;
        if (!tabBar) return;
        const ro = new ResizeObserver(() => centerActivePill());
        ro.observe(tabBar);
        return () => ro.disconnect();
    }, [centerActivePill]);

    return (
        <div ref={tabBarRef} className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4">
            {ROUND_SEQUENCE.map((roundId) => {
                // Champion is the Final's right pair — render with Final, not its own tab.
                if (roundId === 'champion') return null;
                const active = roundId === activeRound;
                return (
                    <ClickableButton
                        key={roundId}
                        ref={active ? activePillRef : undefined}
                        onClick={() => onSelect(roundId)}
                        className={classNames(
                            'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-colors',
                            active ? 'bg-highlight text-white' : 'bg-bg text-second',
                        )}
                    >
                        {ROUND_LABELS[roundId]}
                    </ClickableButton>
                );
            })}
        </div>
    );
});
