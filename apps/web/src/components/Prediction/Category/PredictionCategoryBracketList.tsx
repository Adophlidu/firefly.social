'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { FootballLoading } from '@/components/FootballLoading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { PredictionBracketChampionCard } from '@/components/Prediction/Category/Bracket/PredictionBracketChampionCard.js';
import { PredictionBracketMatchCard } from '@/components/Prediction/Category/Bracket/PredictionBracketMatchCard.js';
import { PredictionBracketRoundTabs } from '@/components/Prediction/Category/Bracket/PredictionBracketRoundTabs.js';
import { resolveRoundWindow, ROUND_SEQUENCE } from '@/helpers/prediction/category/bracket/bracketView.js';
import { buildConnectorPath } from '@/helpers/prediction/category/bracket/connectorPath.js';
import type {
    BracketColumnId,
    FifaBracketMatch,
    FifaBracketRoundId,
} from '@/helpers/prediction/category/bracket/types.js';
import { getWorldCupBracket } from '@/providers/firefly/prediction/getWorldCupBracket.js';

const COLUMN_GAP = 24; // matches gap-6 between columns
const CONNECTOR_RADIUS = 8; // soft bracket roundover; auto-clamped per connector
const EDGE_PAD = 16; // matches px-4 on the inner track
const SLOT_GAP = 16; // vertical breathing room per match slot
const FALLBACK_CARD_HEIGHT = 150;
const ANIM_MS = 300; // must match the CSS transition duration so both axes finish together
const SCROLL_URL_SYNC_MS = 150; // trailing debounce before a drag writes the focused round to the URL

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
    const didInitScrollRef = useRef(false);
    const urlSyncTimerRef = useRef<number | null>(null);
    const remeasureTimerRef = useRef<number | null>(null);
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [cardWidth, setCardWidth] = useState(0);
    const [cardHeight, setCardHeight] = useState(FALLBACK_CARD_HEIGHT);
    const [selected, setSelected] = useQueryState<BracketColumnId>(
        'round',
        parseAsStringEnum<BracketColumnId>([...ROUND_SEQUENCE])
            .withDefault('r32')
            .withOptions({ clearOnDefault: true, history: 'replace' }),
    );
    // Drives layout; the URL (`selected`) is written on a debounce (handleScroll), not per frame.
    const [focus, setFocus] = useState<BracketColumnId>(selected);

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

        const innerRect = inner.getBoundingClientRect();
        const next: Connector[] = [];
        for (const round of data.rounds) {
            for (const match of round.matches) {
                const target = match.feedsIntoMatchId;
                if (!target) continue;
                const childEl = cardEls.current.get(match.id);
                const parentEl = cardEls.current.get(target);
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

        // Final has no feedsIntoMatchId — draw the terminal Final→Champion connector here.
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
    }, [data, cardHeight]);

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

    // The round nearest the left edge becomes the focus so the collapse tracks the drag. The URL write
    // is debounced to scroll-end — calling nuqs setSelected every frame stuttered long drags (champion→R32).
    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container || cardWidth <= 0 || animatingRef.current) return;
        const index = Math.round(container.scrollLeft / (cardWidth + COLUMN_GAP));
        const clamped = Math.min(Math.max(index, 0), ROUND_SEQUENCE.length - 2);
        const round = ROUND_SEQUENCE[clamped];
        setFocus(round);
        if (urlSyncTimerRef.current !== null) window.clearTimeout(urlSyncTimerRef.current);
        urlSyncTimerRef.current = window.setTimeout(() => {
            urlSyncTimerRef.current = null;
            setSelected(round);
        }, SCROLL_URL_SYNC_MS);
    }, [cardWidth, setSelected]);

    useLayoutEffect(() => {
        measureWidth();
    }, [measureWidth]);

    // On mount, jump once (no animation) to the focused round's column. The canvas is already sized for
    // it, but the scroll container starts at 0, so without this a non-r32 deep-link shows r32 crammed.
    useLayoutEffect(() => {
        if (didInitScrollRef.current || cardWidth <= 0) return;
        const container = scrollRef.current;
        if (!container) return;
        const leftIndex = ROUND_SEQUENCE.indexOf(resolveRoundWindow(selected).left);
        container.scrollLeft = leftIndex * (cardWidth + COLUMN_GAP);
        didInitScrollRef.current = true;
    }, [cardWidth, selected]);

    // Not keyed on `focus` — recomputing connectors (a getBoundingClientRect sweep) on every scroll
    // boundary blocks paint and freezes the drag. Deferred to settle below.
    useLayoutEffect(() => {
        remeasure();
    }, [remeasure, cardWidth]);

    // Redraw connectors once the collapse transition (ANIM_MS) has settled after a focus change.
    useEffect(() => {
        if (remeasureTimerRef.current !== null) window.clearTimeout(remeasureTimerRef.current);
        remeasureTimerRef.current = window.setTimeout(() => {
            remeasureTimerRef.current = null;
            remeasure();
        }, ANIM_MS + 32);
        return () => {
            if (remeasureTimerRef.current !== null) {
                window.clearTimeout(remeasureTimerRef.current);
                remeasureTimerRef.current = null;
            }
        };
    }, [focus, remeasure]);

    // Mirror external URL changes (back/forward) into focus. Internal writes keep focus === selected, so no loop.
    useEffect(() => {
        setFocus((prev) => (prev === selected ? prev : selected));
    }, [selected]);

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
            // Explicit intent: set focus + URL now, and cancel any pending drag-debounce write.
            if (urlSyncTimerRef.current !== null) {
                window.clearTimeout(urlSyncTimerRef.current);
                urlSyncTimerRef.current = null;
            }
            setFocus(left);
            setSelected(left);
            if (cardWidth > 0) {
                const leftIndex = ROUND_SEQUENCE.indexOf(left);
                animateScrollTo(leftIndex * (cardWidth + COLUMN_GAP));
            }
        },
        [cardWidth, animateScrollTo, setSelected],
    );

    useEffect(() => {
        return () => {
            cancelAnimationFrame(rafRef.current);
            if (urlSyncTimerRef.current !== null) window.clearTimeout(urlSyncTimerRef.current);
            if (remeasureTimerRef.current !== null) window.clearTimeout(remeasureTimerRef.current);
        };
    }, []);

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

    const roundWindow = resolveRoundWindow(focus);
    const leftIndex = ROUND_SEQUENCE.indexOf(roundWindow.left);
    // Center the Final only while the Semifinals are focused; when the Final is focused, top-align it.
    const finalCentered = roundWindow.right === 'final';
    // Rounds before the focused pair are already decided, so they collapse to make room. Derived
    // from the live focus (follows scroll), not a scroll threshold.
    const isHalf = (roundId: BracketColumnId) => ROUND_SEQUENCE.indexOf(roundId) < leftIndex;

    // The third-place round shares the Final column (rendered below the Final, no connectors).
    const matchesForColumn = (roundId: BracketColumnId): FifaBracketMatch[] => {
        const round = (id: FifaBracketRoundId) => data.rounds.find((r) => r.id === id)?.matches ?? [];
        if (roundId === 'final') return [...round('final'), ...round('third')];
        if (roundId === 'champion') return [];
        return round(roundId);
    };

    // The canvas height is driven by the focused left round (count × slot), not the tallest round.
    // Otherwise a deep focus (Semifinals/Final) leaves the earlier 16-match round dictating a huge
    // canvas, pushing the few focused cards far down with empty space above.
    const leftCount = matchesForColumn(roundWindow.left).length;
    // While finalCentered, reserve three card heights for the centered Final + third beneath it.
    const hasThird = (data.rounds.find((r) => r.id === 'third')?.matches.length ?? 0) > 0;
    const stackedFloor = hasThird && finalCentered ? 3 * cardHeight + 2 * SLOT_GAP : 0;
    const canvasHeight = Math.max(Math.max(leftCount, 1) * (cardHeight + SLOT_GAP), stackedFloor);

    return (
        <div className="flex h-full grow flex-col gap-4 pt-0">
            <PredictionBracketRoundTabs activeRound={roundWindow.left} onSelect={handlePillClick} />

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
                                    className={classNames(
                                        'relative z-10 flex h-full shrink-0 snap-start flex-col',
                                        finalCentered ? 'justify-center' : 'justify-start',
                                    )}
                                    style={{ width: cardWidth || undefined }}
                                >
                                    <div
                                        ref={(el) => {
                                            if (el) cardEls.current.set('champion', el);
                                        }}
                                        style={{ height: cardHeight }}
                                    >
                                        <PredictionBracketChampionCard team={championTeam} />
                                    </div>
                                </div>
                            );
                        }
                        const columnMatches = matchesForColumn(roundId);
                        if (!columnMatches.length) return null;
                        const half = isHalf(roundId);
                        // Final column: center the Final (finalCentered) or top-align it; third-place hangs below.
                        const stacked = !half && roundId === 'final' && columnMatches.length > 1;
                        const columnJustify = !stacked
                            ? 'justify-around'
                            : finalCentered
                              ? 'justify-center'
                              : 'justify-start';
                        // First third-place card sits beneath the Final (centered or top-aligned).
                        const thirdTop = finalCentered
                            ? canvasHeight / 2 + cardHeight / 2 + SLOT_GAP
                            : cardHeight + SLOT_GAP;
                        return (
                            <div
                                key={roundId}
                                className={classNames(
                                    'relative z-10 flex h-full shrink-0 snap-start flex-col',
                                    columnJustify,
                                )}
                                style={{ width: cardWidth || undefined }}
                            >
                                {columnMatches.map((match, index) => {
                                    // In the stacked Final column only the Final (index 0) stays in normal
                                    // flow (centered); third-place cards (index > 0) are absolutely stacked
                                    // beneath it, with no connector drawn to them.
                                    const isHanging = stacked && index > 0;
                                    return (
                                        <div
                                            key={match.id}
                                            ref={(el) => {
                                                if (el) cardEls.current.set(match.id, el);
                                            }}
                                            className={classNames(
                                                'overflow-hidden transition-[height] duration-300 ease-out',
                                                { 'absolute inset-x-0': isHanging },
                                            )}
                                            style={{
                                                // Collapsed rounds (more matches than the focus) shrink to fit the
                                                // canvas; the focused/later rounds keep full card height.
                                                height: half
                                                    ? Math.max(canvasHeight / columnMatches.length, 8)
                                                    : cardHeight,
                                                ...(isHanging
                                                    ? { top: thirdTop + (index - 1) * (cardHeight + SLOT_GAP) }
                                                    : null),
                                            }}
                                        >
                                            <PredictionBracketMatchCard match={match} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
