'use client';

import { Trans } from '@lingui/react/macro';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { isEqual } from 'lodash-es';
import { useEffect } from 'react';

import { ComposeSend } from '@/components/Compose/ComposeSend.js';
import { DraftButton } from '@/components/IconButton.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { DraftPostType } from '@/constants/enum.js';
import { isEmptyPost } from '@/helpers/isEmptyPost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useSaveDraftInCompose } from '@/hooks/useSaveDraftInCompose.js';
import { useComposeModalContext } from '@/modals/ComposeModal/context.js';
import { captureDraftClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function ComposeRouteRoot() {
    const isMedium = useIsMedium();
    const { history, state } = useRouter();
    const { location } = useRouterState();
    const { onClose } = useComposeModalContext();
    const { removeTempDrafts } = useComposeDraftState();
    const [, saveDraftInCompose] = useSaveDraftInCompose(DraftPostType.LocalTemp);

    const pathname = location.pathname;

    const isDraft = pathname === '/draft';
    const isGif = pathname === '/gif';
    const enableBack = isDraft || isGif;

    const draftButton = (
        <DraftButton
            size={isMedium ? 24 : 18}
            className="text-fourMain cursor-pointer"
            onClick={() => {
                history.push('/draft');
                captureDraftClickEvent();
            }}
        />
    );

    useEffect(
        () =>
            useComposeStateStore.subscribe((state, prevState) => {
                if (isEqual(state.posts, prevState.posts)) return;

                if (state.posts.some((x) => !isEmptyPost(x))) {
                    saveDraftInCompose();
                } else {
                    removeTempDrafts();
                }
            }),
        [saveDraftInCompose, removeTempDrafts],
    );

    return (
        <>
            <div className="pt-safe relative flex shrink-0 items-center justify-between">
                <ModalTitle
                    title={
                        <div className="flex w-full items-center justify-center gap-1">
                            {[...state.matches].reverse().find((x) => x.context.title)?.context.title ?? (
                                <Trans>Compose</Trans>
                            )}
                            {!isMedium && !isDraft && !isGif ? draftButton : null}
                        </div>
                    }
                    actions={enableBack ? null : isMedium ? draftButton : <ComposeSend />}
                    enableClose={!enableBack}
                    enableBack={enableBack}
                    onBack={() => history.replace('/')}
                    onClose={onClose}
                />
            </div>
            <Outlet />
        </>
    );
}
