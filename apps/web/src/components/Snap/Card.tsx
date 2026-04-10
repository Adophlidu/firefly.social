'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import urlcat from 'urlcat';

import { FootnoteLink } from '@/components/FootnoteLink.js';
import { frameSwapToken } from '@/components/Frame/V2/frameSwapToken.js';
import { SnapContextProvider, useSnapContext } from '@/components/Snap/SnapContext.js';
import { SnapElementRenderer } from '@/components/Snap/SnapElementRenderer.js';
import { snapOpenSendToken } from '@/components/Snap/snapSendToken.js';
import { getSnapViewTokenPath } from '@/components/Snap/snapViewToken.js';
import { SocialProfileCategory, Source } from '@/constants/enum.js';
import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { useRouter } from '@/esm/navigation.js';
import { createDummyChannel } from '@/helpers/createDummyChannel.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { openWindow } from '@/helpers/openWindow.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal/refs.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import {
    type Snap,
    type SnapAction,
    type SnapDigestedResponse,
    type SnapFieldValues,
    type SnapJFSPayload,
} from '@/types/snap.js';
import { type ResponseJson } from '@/types/utility.js';

function buildInputs(fields: SnapFieldValues): SnapJFSPayload['inputs'] {
    return {
        ...fields.inputs,
        ...Object.fromEntries(Object.entries(fields.sliders)),
        ...Object.fromEntries(Object.entries(fields.switches)),
        ...Object.fromEntries(Object.entries(fields.toggleGroups)),
        ...Object.fromEntries(Object.entries(fields.cellGrids)),
    };
}

/**
 * Multi-color snow palette (canvas-confetti with `particleCount: 1` always picks index 0,
 * so we pass one random hex per burst in `runSnowConfetti`).
 */
const SNOW_CONFETTI_COLORS = [
    '#ffffff',
    '#7dd3fc',
    '#a78bfa',
    '#f472b6',
    '#34d399',
    '#fbbf24',
    '#22d3ee',
    '#fb923c',
    '#c4b5fd',
    '#86efac',
];

type ConfettiFire = ((options?: Record<string, unknown>) => void) & { reset?: () => void };

function runSnowConfetti(fire: ConfettiFire) {
    const duration = 5_000;
    const animationEnd = Date.now() + duration;
    let skew = 1;
    let rafId = 0;
    let cancelled = false;

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    function frame() {
        if (cancelled) return;
        const timeLeft = animationEnd - Date.now();
        const ticks = Math.max(200, 500 * (timeLeft / duration));
        skew = Math.max(0.8, skew - 0.001);

        const color = SNOW_CONFETTI_COLORS[Math.floor(Math.random() * SNOW_CONFETTI_COLORS.length)];

        fire({
            particleCount: 1,
            startVelocity: 0,
            ticks,
            origin: {
                x: Math.random(),
                y: Math.random() * skew - 0.2,
            },
            colors: [color],
            shapes: ['circle'],
            gravity: randomInRange(0.4, 0.6),
            scalar: randomInRange(0.4, 1),
            drift: randomInRange(-0.4, 0.4),
        });

        if (timeLeft > 0) {
            rafId = requestAnimationFrame(frame);
        }
    }

    rafId = requestAnimationFrame(frame);

    return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        fire.reset?.();
    };
}

// Inner component — reads fields from context and wires actions
function SnapInner({ snap, onAction }: { snap: Snap; onAction: (action: SnapAction) => void }) {
    const { fields } = useSnapContext();

    const dispatch = useCallback(
        (action: SnapAction) => {
            // inject current field snapshot into submit actions before dispatching
            onAction(action);
        },
        [onAction],
    );

    return <SnapElementRenderer elementId={snap.ui.root} ui={snap.ui} onAction={dispatch} />;
}

interface CardProps {
    snap: Snap;
    post: Post;
}

export const SnapCard = memo<CardProps>(function SnapCard({ snap: initialSnap, post }) {
    const router = useRouter();
    const [snap, setSnap] = useState<Snap>(initialSnap);
    const [loading, setLoading] = useState(false);
    const confettiTriggered = useRef(false);
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

    // Snow-like confetti scoped to the snap card canvas (not full viewport)
    useLayoutEffect(() => {
        if (!snap.effects?.includes('confetti') || confettiTriggered.current) {
            confettiTriggered.current = false;
            return;
        }

        const canvas = confettiCanvasRef.current;
        if (!canvas) {
            return;
        }

        confettiTriggered.current = true;
        let cancelled = false;
        let stopSnow: (() => void) | undefined;
        void import('canvas-confetti')
            .then((mod) => {
                if (cancelled) return;
                const create = mod.create;
                if (typeof create !== 'function') return;
                const fireOnCard = create(canvas, { resize: true }) as ConfettiFire;
                stopSnow = runSnowConfetti(fireOnCard);
            })
            .catch(() => void 0);
        return () => {
            cancelled = true;
            stopSnow?.();
            confettiTriggered.current = false;
        };
    }, [snap]);

    const handleAction = useCallback(
        async (action: SnapAction, fields: SnapFieldValues) => {
            try {
                switch (action.action) {
                    case 'submit': {
                        const session = farcasterSessionHolder.session;
                        if (!session) {
                            openLoginModal({ source: Source.Farcaster });
                            return;
                        }

                        setLoading(true);

                        const payload: SnapJFSPayload = {
                            fid: Number.parseInt(session.profileId, 10),
                            inputs: buildInputs(fields),
                            timestamp: Math.floor(Date.now() / 1000),
                            nonce: crypto.randomUUID(),
                            audience: new URL(action.params.target).origin,
                            button_index: 0,
                        };

                        const url = urlcat(FIREFLY_WORKER_HOST, '/snap', {
                            url: snap.url,
                            target: action.params.target,
                        });

                        const response = await fetchJson<ResponseJson<SnapDigestedResponse>>(url, {
                            method: 'POST',
                            body: JSON.stringify({
                                profileId: session.profileId,
                                token: session.token,
                                payload,
                            }),
                        });

                        if (response.success && response.data.snap) {
                            setSnap(response.data.snap);
                        } else {
                            enqueueErrorMessage(<Trans>The snap server failed to process the request.</Trans>);
                        }
                        return;
                    }

                    case 'open_snap': {
                        setLoading(true);
                        const snapUrl = urlcat(FIREFLY_WORKER_HOST, '/snap', { url: action.params.target });
                        const response = await fetchJson<ResponseJson<SnapDigestedResponse>>(snapUrl);
                        if (response.success && response.data.snap) {
                            setSnap(response.data.snap);
                        } else {
                            enqueueErrorMessage(<Trans>The snap server failed to process the request.</Trans>);
                        }
                        return;
                    }

                    case 'open_url': {
                        const intercepted = await interceptExternalUrl(action.params.target);
                        if (!intercepted && (await ConfirmLeavingModalRef.openAndWaitForClose(action.params.target))) {
                            openWindow(action.params.target, '_blank');
                        }
                        return;
                    }

                    case 'open_mini_app':
                        openWindow(action.params.target, '_blank');
                        return;

                    case 'compose_cast': {
                        const session = farcasterSessionHolder.session;
                        if (!session) {
                            openLoginModal({ source: Source.Farcaster });
                            return;
                        }

                        await ComposeModalRef.openAndWaitForClose({
                            source: Source.Farcaster,
                            type: 'compose',
                            chars: action.params.text,
                            embeds: action.params.embeds,
                            channel: action.params.channelKey
                                ? createDummyChannel(Source.Farcaster, action.params.channelKey)
                                : undefined,
                        });
                        return;
                    }

                    case 'view_cast': {
                        router.push(`/post/farcaster/${action.params.hash}`);
                        return;
                    }

                    case 'view_profile': {
                        const path = getProfileUrl(
                            { source: Source.Farcaster, profileId: String(action.params.fid) },
                            SocialProfileCategory.Feed,
                        );
                        if (path) {
                            router.push(urlcat(path, { fid: action.params.fid }));
                        }
                        return;
                    }

                    case 'swap_token': {
                        await frameSwapToken({
                            sellToken: action.params.sellToken,
                            buyToken: action.params.buyToken,
                        });
                        return;
                    }

                    case 'send_token': {
                        await snapOpenSendToken(action.params);
                        return;
                    }

                    case 'view_token': {
                        const path = getSnapViewTokenPath(action.params.token);
                        if (path) {
                            router.push(path);
                        } else {
                            enqueueWarningMessage(<Trans>This token link is not supported.</Trans>);
                        }
                        return;
                    }

                    default:
                        return;
                }
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Something went wrong. Please try again.</Trans>);
            } finally {
                setLoading(false);
            }
        },
        [router, snap.url],
    );

    // We need to pass fields into handleAction; use a ref-based bridge via context
    const fieldsRef = useRef<SnapFieldValues>({
        inputs: {},
        sliders: {},
        switches: {},
        toggleGroups: {},
        cellGrids: {},
    });

    const dispatchWithFields = useCallback(
        (action: SnapAction) => handleAction(action, fieldsRef.current),
        [handleAction],
    );

    return (
        <SnapContextProvider
            accent={snap.theme?.accent ?? 'purple'}
            loading={loading}
            onFieldsChange={(fields) => {
                fieldsRef.current = fields;
            }}
        >
            <div className="mt-4 flex flex-col" data-prevent-progress="true">
                <div
                    className="border-line bg-bg relative max-h-[580px] w-full overflow-hidden rounded-xl border"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="max-h-[580px] overflow-y-auto overscroll-contain p-3">
                        <SnapElementRenderer elementId={snap.ui.root} ui={snap.ui} onAction={dispatchWithFields} />
                    </div>
                    <canvas
                        ref={confettiCanvasRef}
                        aria-hidden
                        className="pointer-events-none absolute inset-0 z-10 block size-full rounded-xl"
                    />
                </div>
                <FootnoteLink href={snap.url} />
            </div>
        </SnapContextProvider>
    );
});
