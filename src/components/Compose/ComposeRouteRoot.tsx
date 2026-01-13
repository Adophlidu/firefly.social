import { Trans } from '@lingui/react/macro';
import { Outlet, useRouter } from '@tanstack/react-router';

import { ComposeSend } from '@/components/Compose/ComposeSend.js';
import { DraftButton } from '@/components/IconButton.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeModalContext } from '@/modals/ComposeModal/context.js';
import { captureDraftClickEvent } from '@/providers/telemetry/captureClickEvent.js';

export function ComposeRouteRoot() {
    const isMedium = useIsMedium();
    const { history, state } = useRouter();
    const { onClose } = useComposeModalContext();

    const pathname = history.location.pathname;

    const isDraft = pathname === '/draft';
    const isGif = pathname === '/gif';
    const enableBack = isDraft || isGif;

    const draftButton = (
        <DraftButton
            size={isMedium ? 24 : 18}
            className="cursor-pointer text-fourMain"
            onClick={() => {
                history.push('/draft');
                captureDraftClickEvent();
            }}
        />
    );

    return (
        <>
            <div className="relative flex shrink-0 items-center justify-between pt-safe">
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
