'use client';

import { Trans } from '@lingui/react/macro';

export function ProtectedPostsMessage() {
    return (
        <div className="flex flex-col">
            <div className="mt-[42px] text-lg text-second">
                <Trans>These posts are protected</Trans>
            </div>
            <div className="mt-6 text-base text-second">
                <Trans>
                    Only approved followers can see these posts.
                    <br />
                    To request access, click Follow.
                </Trans>
            </div>
        </div>
    );
}
