import { Trans } from '@lingui/react/macro';
import { rootRouteId, useMatch } from '@tanstack/react-router';
import { uniqBy } from 'lodash-es';
import { useCallback, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { TipsModalHeader } from '@/components/Tips/TipsModalHeader.js';
import { SITE_URL_OFFICIAL } from '@/constants/index.js';
import { CHAR_TAG } from '@/helpers/chars.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { useCurrentVisitingChannel } from '@/hooks/useCurrentVisitingChannel.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { TipsContext } from '@/hooks/useTipsContext.js';
import { ComposeModalRef } from '@/modals/controls.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export function TipSuccess() {
    const { amount, token, recipient, handle, hash: hashUrl, socialProfiles, post } = TipsContext.useContainer();
    const currentChannel = useCurrentVisitingChannel();
    const { context } = useMatch({ from: rootRouteId });
    const isLogin = useIsLogin();

    const { canShare, walletName } = useMemo(() => {
        const __origin__ = recipient?.__origin__ as WalletProfile;
        if (!handle || !__origin__?.verifiedSources?.length || !socialProfiles.length || !isLogin)
            return { canShare: false };
        return {
            canShare: true,
            walletName: __origin__.primary_ens || formatAddressEthereum(__origin__.address, 4),
        };
    }, [recipient, handle, socialProfiles, isLogin]);

    const profiles = uniqBy(socialProfiles, 'platform');
    const mentionHandle = profiles.find((x) => x.handle === handle) ? handle : profiles[0]?.handle;

    const onShare = useCallback(() => {
        const expectedSources = getCurrentAvailableSources().filter((source) =>
            post
                ? post.source === source
                : profiles.some((profile) => resolveSocialSourceFromFireflyPlatform(profile.platform) === source),
        );
        if (!expectedSources.length) {
            openLoginModal({
                source: post ? post.source : resolveSocialSourceFromFireflyPlatform(profiles[0].platform),
            });
            return;
        }
        context.onClose();
        ComposeModalRef.open({
            type: post ? 'reply' : 'compose',
            post,
            channel: currentChannel,
            source: expectedSources,
            chars: [
                `${amount} $${token?.symbol} tip sent to your wallet ${walletName} using `,
                {
                    tag: CHAR_TAG.MENTION,
                    visible: true,
                    content: `@${mentionHandle}`,
                    profiles,
                },
                ' ! Try it now on ',
                ` ${SITE_URL_OFFICIAL} .`,
            ],
        });
    }, [amount, token, post, currentChannel, walletName, context, mentionHandle, profiles]);

    return (
        <>
            <TipsModalHeader title={<Trans>Tip transaction completed!</Trans>} />
            <div>
                <div className="md:px-6">
                    <p>
                        {canShare ? (
                            <Trans>
                                Tag {mentionHandle || recipient?.displayName} in a post to let them know you’ve sent an
                                onchain tip to their wallet.
                            </Trans>
                        ) : (
                            <Trans>
                                You successfully sent{' '}
                                <span className="font-bold text-link">{`${amount} ${'$'}${token?.symbol}`}</span> tips
                                to <span className="font-bold text-link">{handle || recipient?.displayName}</span>!
                            </Trans>
                        )}
                    </p>
                    {hashUrl ? (
                        <p className="mt-2 text-center">
                            <Link
                                className="italic text-link underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                href={hashUrl}
                            >
                                <Trans>View transaction on explorer</Trans>
                            </Link>
                        </p>
                    ) : null}
                </div>
                {canShare ? (
                    <ClickableButton
                        className="mt-6 h-10 w-full rounded-full border border-lightMain bg-transparent text-center font-bold text-lightMain"
                        onClick={onShare}
                    >
                        <Trans>Create a Post</Trans>
                    </ClickableButton>
                ) : null}
            </div>
        </>
    );
}
