'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import urlcat from 'urlcat';

import { FootnoteLink } from '@/components/FootnoteLink.js';
import { frameSwapToken } from '@/components/Frame/V2/frameSwapToken.js';
import { SnapContextProvider } from '@/components/Snap/SnapContext.js';
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
import { validateSnapStructure } from '@/helpers/snap.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal/refs.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Snap, SnapAction, SnapDigestedResponse, SnapFieldValues, SnapJFSPayload } from '@/types/snap.js';
import type { ResponseJson } from '@/types/utility.js';

function buildInputs(fields: SnapFieldValues): SnapJFSPayload['inputs'] {
    return {
        ...fields.inputs,
        ...fields.sliders,
        ...fields.switches,
        ...fields.toggleGroups,
        ...fields.cellGrids,
    };
}

function getSubmitButtonIndex(snap: Snap, elementId: string) {
    // v1 snaps rely on button_index; compute a deterministic index by DFS traversal order.
    const orderedSubmitButtonIds: string[] = [];
    const visited = new Set<string>();
    const stack = [snap.ui.root];

    while (stack.length) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const element = snap.ui.elements[currentId];
        if (!element) continue;
        if (element.type === 'button' && element.on?.press?.action === 'submit') {
            orderedSubmitButtonIds.push(currentId);
        }

        const children = element.children ?? [];
        for (let index = children.length - 1; index >= 0; index -= 1) {
            stack.push(children[index]);
        }
    }

    const matchedIndex = orderedSubmitButtonIds.indexOf(elementId);
    return matchedIndex >= 0 ? matchedIndex : 0;
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
        if (!snap.effects?.includes('confetti')) {
            confettiTriggered.current = false;
            return;
        }
        if (confettiTriggered.current) return;

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
    }, [snap.effects]);

    const handleAction = useCallback(
        async (action: SnapAction, fields: SnapFieldValues, elementId: string) => {
            try {
                switch (action.action) {
                    case 'submit': {
                        const session = farcasterSessionHolder.session;
                        if (!session) {
                            openLoginModal({ source: Source.Farcaster });
                            return;
                        }

                        if (snap.version === '2.0') {
                            try {
                                new URL(action.params.target);
                            } catch {
                                enqueueErrorMessage(<Trans>The snap contains an invalid submit URL.</Trans>);
                                return;
                            }
                        }

                        setLoading(true);

                        const fid = Number.parseInt(session.profileId, 10);
                        const commonPayload = {
                            inputs: buildInputs(fields),
                            timestamp: Math.floor(Date.now() / 1000),
                            nonce: crypto.randomUUID(),
                        };
                        const payload: SnapJFSPayload =
                            snap.version === '2.0'
                                ? {
                                      ...commonPayload,
                                      audience: new URL(action.params.target).origin,
                                      user: { fid },
                                      // Keep deprecated top-level fid during migration for compatibility.
                                      fid,
                                      surface: { type: 'cast_embed' },
                                  }
                                : {
                                      ...commonPayload,
                                      fid,
                                      button_index: getSubmitButtonIndex(snap, elementId),
                                  };

                        const url = urlcat(
                            FIREFLY_WORKER_HOST,
                            snap.version === '2.0' ? '/fc-snap/v2' : '/fc-snap/v1',
                            {
                                url: snap.url,
                                target: action.params.target,
                            },
                        );

                        const response = await fetchJson<ResponseJson<SnapDigestedResponse>>(url, {
                            method: 'POST',
                            body: JSON.stringify({
                                profileId: session.profileId,
                                token: session.token,
                                payload,
                            }),
                        });

                        if (response.success && response.data.snap) {
                            const validationError = validateSnapStructure(response.data.snap);
                            if (validationError) {
                                enqueueErrorMessage(validationError);
                                return;
                            }
                            fieldsRef.current = {
                                inputs: {},
                                sliders: {},
                                switches: {},
                                toggleGroups: {},
                                cellGrids: {},
                            };
                            setSnap(response.data.snap);
                        } else {
                            enqueueErrorMessage(<Trans>The snap server failed to process the request.</Trans>);
                        }
                        return;
                    }

                    case 'open_snap': {
                        setLoading(true);
                        const snapUrl = urlcat(FIREFLY_WORKER_HOST, '/fc-snap', { link: action.params.target });
                        const response = await fetchJson<ResponseJson<SnapDigestedResponse>>(snapUrl);
                        if (response.success && response.data.snap) {
                            const validationError = validateSnapStructure(response.data.snap);
                            if (validationError) {
                                enqueueErrorMessage(validationError);
                                return;
                            }
                            fieldsRef.current = {
                                inputs: {},
                                sliders: {},
                                switches: {},
                                toggleGroups: {},
                                cellGrids: {},
                            };
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

                    case 'open_mini_app': {
                        const intercepted = await interceptExternalUrl(action.params.target);
                        if (!intercepted && (await ConfirmLeavingModalRef.openAndWaitForClose(action.params.target))) {
                            openWindow(action.params.target, '_blank');
                        }
                        return;
                    }

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
                        if (/^0x[0-9a-fA-F]+$/.test(action.params.hash)) {
                            router.push(`/post/farcaster/${action.params.hash}`);
                        } else {
                            enqueueWarningMessage(<Trans>Invalid cast link.</Trans>);
                        }
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
        [router, snap],
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
        (action: SnapAction, elementId: string) => handleAction(action, fieldsRef.current, elementId),
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
                    className="border-line1 bg-bg relative max-h-[580px] w-full overflow-hidden rounded-xl border"
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
