'use client';

import MoreIcon from '@dimensiondev/assets/more.svg';
import { ArticlePlatform, Source } from '@dimensiondev/enums';
import { formatAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { MenuItem } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { MuteWalletButton } from '@/components/Actions/MuteWalletButton.js';
import { ReportArticleButton } from '@/components/Actions/ReportArticleButton.js';
import { WatchWalletButton } from '@/components/Actions/WatchWalletButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tips } from '@/components/Tips/index.js';
import { Tooltip } from '@/components/Tooltip.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useToggleArticleBookmark } from '@/hooks/useToggleArticleBookmark.js';
import type { Article } from '@/providers/types/Article.js';

interface MoreProps {
    article: Article;
}

export const ArticleMoreAction = memo<MoreProps>(function ArticleMoreAction({ article }) {
    const mutation = useToggleArticleBookmark();
    const author = article.author;
    const isBusy = mutation.isPending;

    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    const address =
        isMattersArticle && isValidAddressEthereum(author.info.ethAddress) ? author.info.ethAddress : author.id;
    const isAddress = address ? isValidAddressEthereum(address) : false;

    const identity = useFireflyIdentity(Source.Wallet, address);
    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);

    const { data: ens } = useEnsName(address);

    const handleOrEnsOrAddress = isMattersArticle
        ? formatAddress(author.info.ethAddress, 4)
        : author.handle || ens || formatAddress(author.id, 4);

    return (
        <MoreActionMenu
            className="z-10"
            button={
                isBusy ? (
                    <span className="inline-flex size-6 animate-spin items-center justify-center">
                        <LoadingIcon size={16} className="text-secondary" />
                    </span>
                ) : (
                    <Tooltip content={<Trans>More</Trans>} placement="top">
                        <MoreIcon className="text-secondary" width={24} height={24} />
                    </Tooltip>
                )
            }
        >
            <MenuGroup>
                {!isMyProfile && isAddress ? (
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <WatchWalletButton
                                    handleOrEnsOrAddress={handleOrEnsOrAddress}
                                    isFollowing={author.isFollowing}
                                    address={address}
                                    onClick={close}
                                />
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MuteWalletButton
                                    handleOrEnsOrAddress={handleOrEnsOrAddress}
                                    isMuted={author.isMuted}
                                    address={address}
                                    onClick={close}
                                />
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <Tips
                                    className="!text-main hover:bg-bg px-3 py-1"
                                    identity={identity}
                                    handle={ens}
                                    tooltipDisabled
                                    label={t`Send a tip`}
                                    onClick={close}
                                    pureWallet
                                />
                            )}
                        </MenuItem>
                    </>
                ) : null}
                <MenuItem>{({ close }) => <ReportArticleButton article={article} onClick={close} />}</MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
