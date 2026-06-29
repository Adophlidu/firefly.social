'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { FootballLoading } from '@/components/FootballLoading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { PredictionBracketChampionCard } from '@/components/Prediction/Category/Bracket/PredictionBracketChampionCard.js';
import { PredictionBracketMatchCard } from '@/components/Prediction/Category/Bracket/PredictionBracketMatchCard.js';
import { resolveRoundWindow, ROUND_SEQUENCE } from '@/helpers/prediction/category/bracket/bracketView.js';
import { buildConnectorPath } from '@/helpers/prediction/category/bracket/connectorPath.js';
import type { BracketColumnId } from '@/helpers/prediction/category/bracket/types.js';
import { getWorldCupBracket } from '@/providers/firefly/prediction/getWorldCupBracket.js';

const ROUND_LABELS: Record<BracketColumnId, ReactNode> = {
    r32: <Trans>Round of 32</Trans>,
    r16: <Trans>Round of 16</Trans>,
    qf: <Trans>Quarterfinals</Trans>,
    sf: <Trans>Semifinals</Trans>,
    final: <Trans>Final</Trans>,
    champion: <Trans>Champion</Trans>,
};

const COLUMN_GAP = 24; // matches gap-6 between columns
const CONNECTOR_RADIUS = 8; // soft bracket roundover; auto-clamped per connector
const EDGE_PAD = 16; // matches px-4 on the inner track
const SLOT_GAP = 16; // vertical breathing room per match slot
const FALLBACK_CARD_HEIGHT = 150;
const ANIM_MS = 300; // must match the CSS transition duration so both axes finish together

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

interface Connector {
    id: string;
    d: string;
}

export const PredictionCategoryBracketList = memo(function PredictionCategoryBracketList() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const cardEls = useRef(new Map<string, HTMLElement>());
    const rafRef = useRef(0);
    const animatingRef = useRef(false);
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [cardWidth, setCardWidth] = useState(0);
    const [cardHeight, setCardHeight] = useState(FALLBACK_CARD_HEIGHT);
    const [championHeight, setChampionHeight] = useState(FALLBACK_CARD_HEIGHT);
    const [selected, setSelected] = useState<BracketColumnId>('r32');

    const { data, isPending, isError } = useQuery({
        queryKey: ['prediction', 'category', 'fifa-bracket'],
        queryFn: () => getWorldCupBracket(),
    });

    // The champion is not part of the API payload; derive it from the Final's scores (higher score
    // wins). Tied or null (not-yet-decided / pre-penalty) leaves it undecided → "TBD".
    const championTeam = useMemo(() => {
        const fm = data?.rounds.find((r) => r.id === 'final')?.matches[0];
        if (!fm?.scores) return null;
        const [a, b] = fm.scores;
        if (a === b) return null;
        return fm.teams[a > b ? 0 : 1] ?? null;
    }, [data]);

    // Two full columns fit the viewport: width = (container − side padding − one gap) / 2.
    const measureWidth = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;
        const next = Math.floor((container.clientWidth - EDGE_PAD * 2 - COLUMN_GAP) / 2);
        if (next > 0) setCardWidth((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    }, []);

    // Measure the natural card height and redraw every connector across the whole tree.
    const remeasure = useCallback(() => {
        const inner = innerRef.current;
        if (!inner || !data) return;

        const firstId = data.rounds[0]?.matches[0]?.id;
        const natural = firstId ? cardEls.current.get(firstId)?.scrollHeight : undefined;
        if (natural && Math.abs(natural - cardHeight) > 1) setCardHeight(natural);

        // The champion card is taller than a match card; track its height so the canvas can grow
        // to fit it when the final→champion pair is in view (otherwise it overflows and clips).
        const championNatural = cardEls.current.get('champion')?.scrollHeight;
        if (championNatural && Math.abs(championNatural - championHeight) > 1) setChampionHeight(championNatural);

        const innerRect = inner.getBoundingClientRect();
        const next: Connector[] = [];
        for (const round of data.rounds) {
            for (const match of round.matches) {
                if (!match.feedsIntoMatchId) continue;
                const childEl = cardEls.current.get(match.id);
                const parentEl = cardEls.current.get(match.feedsIntoMatchId);
                if (!childEl || !parentEl) continue;
                const child = childEl.getBoundingClientRect();
                const parent = parentEl.getBoundingClientRect();
                const sx = child.right - innerRect.left;
                const sy = child.top - innerRect.top + child.height / 2;
                const px = parent.left - innerRect.left;
                const py = parent.top - innerRect.top + parent.height / 2;
                next.push({ id: match.id, d: buildConnectorPath(sx, sy, px, py, CONNECTOR_RADIUS) });
            }
        }

        // The Final's feedsIntoMatchId is null, so the loop above skips it. Draw the terminal
        // Final → Champion connector here (same L-shaped formula; the cards share the canvas
        // vertical center, so it reads as a clean horizontal line).
        const finalMatch = data.rounds.find((r) => r.id === 'final')?.matches[0];
        const finalEl = finalMatch ? cardEls.current.get(finalMatch.id) : undefined;
        const championEl = finalMatch ? cardEls.current.get('champion') : undefined;
        if (finalMatch && finalEl && championEl) {
            const child = finalEl.getBoundingClientRect();
            const parent = championEl.getBoundingClientRect();
            const sx = child.right - innerRect.left;
            const sy = child.top - innerRect.top + child.height / 2;
            const px = parent.left - innerRect.left;
            const py = parent.top - innerRect.top + parent.height / 2;
            next.push({ id: 'champion', d: buildConnectorPath(sx, sy, px, py, CONNECTOR_RADIUS) });
        }
        setConnectors(next);
    }, [data, cardHeight, championHeight]);

    // Single rAF loop drives the horizontal scroll for pill taps, on the same duration + easing as
    // the CSS height/collapse transition, so both axes start and finish together.
    const animateScrollTo = useCallback((target: number) => {
        const container = scrollRef.current;
        if (!container) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const start = container.scrollLeft;
        const startedAt = performance.now();
        animatingRef.current = true;
        // scroll-snap mandatory would yank each intermediate scrollLeft back to a snap point and
        // kill the tween, so disable snapping while we animate and restore it (via the class) after.
        container.style.scrollSnapType = 'none';
        const step = (now: number) => {
            const t = Math.min((now - startedAt) / ANIM_MS, 1);
            container.scrollLeft = start + (target - start) * easeOutCubic(t);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                animatingRef.current = false;
                rafRef.current = 0;
                container.style.scrollSnapType = '';
            }
        };
        rafRef.current = requestAnimationFrame(step);
    }, []);

    // Manual drag keeps focus in sync: the round nearest the left edge becomes the focused left, so
    // the collapse follows the scroll. Skipped during the rAF tween (selection is already set).
    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container || cardWidth <= 0 || animatingRef.current) return;
        const index = Math.round(container.scrollLeft / (cardWidth + COLUMN_GAP));
        const clamped = Math.min(Math.max(index, 0), ROUND_SEQUENCE.length - 2);
        setSelected(ROUND_SEQUENCE[clamped]);
    }, [cardWidth]);

    useLayoutEffect(() => {
        measureWidth();
    }, [measureWidth]);

    useLayoutEffect(() => {
        remeasure();
    }, [remeasure, cardWidth, selected]);

    useEffect(() => {
        const container = scrollRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;
        const ro = new ResizeObserver(() => {
            measureWidth();
            remeasure();
        });
        ro.observe(container);
        ro.observe(inner);
        return () => ro.disconnect();
    }, [measureWidth, remeasure]);

    const handlePillClick = useCallback(
        (roundId: BracketColumnId) => {
            const { left } = resolveRoundWindow(roundId);
            setSelected(left);
            if (cardWidth > 0) {
                const leftIndex = ROUND_SEQUENCE.indexOf(left);
                animateScrollTo(leftIndex * (cardWidth + COLUMN_GAP));
            }
        },
        [cardWidth, animateScrollTo],
    );

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    if (isPending) {
        return (
            <div className="flex justify-center py-12">
                <FootballLoading />
            </div>
        );
    }

    if (isError || !data?.rounds.length) {
        return <NoResultsFallback message={<Trans>No predictions found</Trans>} />;
    }

    const roundWindow = resolveRoundWindow(selected);
    const leftIndex = ROUND_SEQUENCE.indexOf(roundWindow.left);
    // Rounds before the focused pair are already decided, so they collapse to make room. Derived
    // from the selection, not a scroll threshold.
    const isHalf = (roundId: BracketColumnId) => ROUND_SEQUENCE.indexOf(roundId) < leftIndex;

    // The canvas height is driven by the focused left round (count × slot), not the tallest round.
    // Otherwise a deep focus (Semifinals/Final) leaves the earlier 16-match round dictating a huge
    // canvas, pushing the few focused cards far down with empty space above.
    const leftCount = data.rounds.find((round) => round.id === roundWindow.left)?.matches.length ?? 1;
    // The champion card is taller than a match card, so the canvas must also fit it — otherwise it
    // clips when the final→champion pair is in view. For deeper focuses the slot-based height
    // already dominates this floor, so it only bites on the final/champion window.
    const canvasHeight = Math.max(Math.max(leftCount, 1) * (cardHeight + SLOT_GAP), championHeight + SLOT_GAP);

    return (
        <div className="flex h-full grow flex-col gap-4 pt-0">
            <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4">
                {ROUND_SEQUENCE.map((roundId) => {
                    // The champion is the Final's right pair, not its own navigable round — show it when
                    // the Final tab is selected, but don't give it a tab of its own.
                    if (roundId === 'champion') return null;
                    const active = roundId === roundWindow.left;
                    return (
                        <ClickableButton
                            key={roundId}
                            onClick={() => handlePillClick(roundId)}
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

            <div
                ref={scrollRef}
                className="no-scrollbar min-h-0 grow snap-x snap-mandatory scroll-pl-4 overflow-auto"
                onScroll={handleScroll}
            >
                <div
                    ref={innerRef}
                    className="relative flex w-max items-stretch gap-6 px-4 transition-[height] duration-300 ease-out"
                    style={{ height: canvasHeight }}
                >
                    <svg
                        className="pointer-events-none absolute inset-0 size-full overflow-visible text-secondaryLine"
                        aria-hidden
                    >
                        {connectors.map((connector) => (
                            <path
                                key={connector.id}
                                d={connector.d}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            />
                        ))}
                    </svg>

                    {ROUND_SEQUENCE.map((roundId) => {
                        if (roundId === 'champion') {
                            return (
                                <div
                                    key="champion"
                                    className="relative z-10 flex h-full shrink-0 snap-start flex-col justify-center"
                                    style={{ width: cardWidth || undefined }}
                                >
                                    <div
                                        ref={(el) => {
                                            if (el) cardEls.current.set('champion', el);
                                        }}
                                    >
                                        <PredictionBracketChampionCard team={championTeam} />
                                    </div>
                                </div>
                            );
                        }
                        const round = data.rounds.find((item) => item.id === roundId);
                        if (!round?.matches.length) return null;
                        const half = isHalf(roundId);
                        return (
                            <div
                                key={roundId}
                                className="relative z-10 flex h-full shrink-0 snap-start flex-col justify-around"
                                style={{ width: cardWidth || undefined }}
                            >
                                {round.matches.map((match) => (
                                    <div
                                        key={match.id}
                                        ref={(el) => {
                                            if (el) cardEls.current.set(match.id, el);
                                        }}
                                        className="overflow-hidden transition-[height] duration-300 ease-out"
                                        style={{
                                            // Collapsed rounds (more matches than the focus) shrink to fit the
                                            // canvas; the focused/later rounds keep full card height.
                                            height: half
                                                ? Math.max(canvasHeight / round.matches.length, 8)
                                                : cardHeight,
                                        }}
                                    >
                                        <PredictionBracketMatchCard match={match} />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
