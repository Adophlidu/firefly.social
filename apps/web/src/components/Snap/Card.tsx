'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import urlcat from 'urlcat';

import { FootnoteLink } from '@/components/FootnoteLink.js';
import { SnapContextProvider, useSnapContext } from '@/components/Snap/SnapContext.js';
import { SnapElementRenderer } from '@/components/Snap/SnapElementRenderer.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { enqueueErrorMessage, enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { openWindow } from '@/helpers/openWindow.js';
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
    const [snap, setSnap] = useState<Snap>(initialSnap);
    const [loading, setLoading] = useState(false);
    const confettiTriggered = useRef(false);

    // trigger confetti on snap change when effect is present
    useEffect(() => {
        if (snap.effects?.includes('confetti') && !confettiTriggered.current) {
            confettiTriggered.current = true;
            // canvas-confetti is a progressive enhancement
            void import('canvas-confetti').then((mod) => (mod.default ?? mod)()).catch(() => void 0);
        } else {
            confettiTriggered.current = false;
        }
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
                            button_index: 0,
                            timestamp: Math.floor(Date.now() / 1000),
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

                    case 'view_cast':
                    case 'view_profile':
                    case 'view_token':
                    case 'send_token':
                    case 'swap_token':
                    case 'compose_cast':
                        // Native-app actions; no-op on web for now
                        return;

                    default:
                        return;
                }
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Something went wrong. Please try again.</Trans>);
            } finally {
                setLoading(false);
            }
        },
        [snap.url],
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
                <div className="border-line bg-bg w-full rounded-xl border p-3" onClick={(e) => e.stopPropagation()}>
                    <SnapElementRenderer elementId={snap.ui.root} ui={snap.ui} onAction={dispatchWithFields} />
                </div>
                <FootnoteLink href={snap.url} />
            </div>
        </SnapContextProvider>
    );
});
