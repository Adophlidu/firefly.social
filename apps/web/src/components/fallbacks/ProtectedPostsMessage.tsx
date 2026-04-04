'use client';

import { Trans } from '@lingui/react/macro';

export function ProtectedPostsMessage() {
    return (
        <div className="flex flex-col">
            <div className="text-second mt-[42px] text-lg">
                <Trans>These posts are protected</Trans>
            </div>
            <div className="text-second mt-6 text-base">
                <Trans>
                    Only approved followers can see these posts.
                    <br />
                    To request access, click Follow.
                </Trans>
            </div>
        </div>
    );
}
