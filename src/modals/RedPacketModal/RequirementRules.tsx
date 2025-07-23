import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

export default memo(function RequirementRulesView() {
    return (
        <div className="flex w-[400px] flex-col gap-6 p-4 pt-0 text-left text-main">
            <div className="flex flex-col gap-3">
                <h2 className="text-base font-bold leading-4">
                    <Trans>Follow me</Trans>
                </h2>
                <div className="text-sm leading-[18px]">
                    <Trans>Users must follow your account.</Trans>
                    <div className="italic">
                        <Trans>
                            <span className="font-bold">Note:</span> If you cross-post a Lucky Drop to multiple social
                            platforms, following your account on any one platform qualifies users to claim.
                        </Trans>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <h2 className="text-base font-bold leading-4">
                    <Trans>Like / Repost / Comment</Trans>
                </h2>
                <div className="text-sm leading-[18px]">
                    <Trans>Users must like, repost/quote, or comment on your post containing the Lucky Drop.</Trans>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <h2 className="text-base font-bold leading-4">
                    <Trans>NFT holder</Trans>
                </h2>
                <div className="text-sm leading-[18px]">
                    <Trans>Users must hold at least one NFT from the collections you specify.</Trans>
                </div>
            </div>
        </div>
    );
});
