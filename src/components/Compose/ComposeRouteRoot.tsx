import { Trans } from '@lingui/react/macro';
import { Outlet, rootRouteId, useMatch, useRouter } from '@tanstack/react-router';

import { ComposeSend } from '@/components/Compose/ComposeSend.js';
import { DraftButton } from '@/components/IconButton.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { captureDraftClickEvent } from '@/providers/telemetry/captureClickEvent.js';

export function ComposeRouteRoot() {
    const { history, state } = useRouter();
    const { context } = useMatch({ from: rootRouteId });

    const pathname = history.location.pathname;

    const isDraft = pathname === '/draft';
    const isGif = pathname === '/gif';

    return (
        <>
            <div className="relative flex shrink-0 items-center justify-between pt-safe">
                <ModalTitle
                    title={
                        [...state.matches].reverse().find((x) => x.context.title)?.context.title ?? (
                            <Trans>Compose</Trans>
                        )
                    }
                    actions={
                        !isDraft && !isGif ? (
                            <DraftButton
                                className="cursor-pointer text-fourMain"
                                onClick={() => {
                                    history.push('/draft');
                                    captureDraftClickEvent();
                                }}
                            />
                        ) : (
                            <ComposeSend />
                        )
                    }
                    enableClose={!isDraft && !isGif}
                    enableBack={isDraft || isGif}
                    onBack={() => history.replace('/')}
                    onClose={context.onClose}
                />
            </div>
            <Outlet />
        </>
    );
}
