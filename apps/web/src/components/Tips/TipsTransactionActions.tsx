'use client';

import ImageDownloadIcon from '@dimensiondev/assets/image-download.svg';
import MirrorIcon from '@dimensiondev/assets/mirror.svg';
import ShareIcon from '@dimensiondev/assets/share.svg';
import { ExtraLikeType, Source, TipsDetailViewType, TipsNotificationType, TxReactionType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { classNames, runInSafeAsync } from '@dimensiondev/utils';
import { formatAddress } from '@dimensiondev/web3/utils';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { type HTMLProps, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { LikeButton } from '@/components/Actions/LikeButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { openAndWaitForCloseComposeModal } from '@/controllers/openComposeModal.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { openShareImageModal } from '@/controllers/openShareImageModal.js';
import { getMentionCharsByIdentity } from '@/helpers/getMentionCharsByIdentity.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { updateTipsReactionStatus } from '@/helpers/updateTipsReactionStatus.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import type { ComposeModalOpenProps } from '@/modals/ComposeModal/types.js';
import { createTxReaction } from '@/providers/firefly/endpoint/createTxReaction.js';
import { getTipsTransactionDetail } from '@/providers/firefly/endpoint/getTipsTransactionDetail.js';
import type { TipsLikeStatusData } from '@/providers/types/Firefly.js';
import type { MentionChars } from '@/types/chars.js';

interface TipsTransactionActionsProps extends HTMLProps<HTMLDivElement> {
    txHash: string;
    tokenSymbol: string;
    fromAddress: string;
    toAddress: string;
    fromAccountId?: string;
    toAccountId?: string;
    chainId: number;
    autoQuery?: boolean;
    liked?: boolean;
    reposted?: boolean;
    view?: TipsDetailViewType;
}

async function sharePost(
    {
        tipsLink,
        tokenSymbol,
        view,
    }: {
        tipsLink: string;
        tokenSymbol: string;
        view?: TipsDetailViewType;
    },
    addressForMention: string,
    mentionChars: MentionChars | null,
) {
    const mentionNode = mentionChars || formatAddress(addressForMention, 4);

    const options: ComposeModalOpenProps =
        view === TipsDetailViewType.Receiver
            ? {
                  chars: ['Thanks ', mentionNode, ', appreciate your tip via ', FIREFLY_MENTION, ' ! 💜\r\n', tipsLink],
              }
            : {
                  chars: [
                      'Hi ',
                      mentionNode,
                      `, sent you some $${tokenSymbol} via `,
                      FIREFLY_MENTION,
                      ' ✨ Keep shining!\r\n',
                      tipsLink,
                  ],
              };

    const result = await openAndWaitForCloseComposeModal(options);
    return !!result?.post;
}

export function TipsTransactionActions({
    txHash,
    liked,
    reposted,
    view,
    tokenSymbol,
    fromAddress,
    toAddress,
    fromAccountId,
    toAccountId,
    chainId,
    autoQuery = false,
    className,
}: TipsTransactionActionsProps) {
    const isLogin = useIsLoginFirefly();
    const { data, isLoading } = useQuery({
        queryKey: ['tips', txHash, isLogin],
        enabled: autoQuery && isLogin,
        queryFn: async () => {
            return getTipsTransactionDetail(txHash, TipsNotificationType.Tip);
        },
    });

    // Composing ("Share" mirror action) carries the sender/receiver view; Copy link intentionally
    // shares the neutral tx link — matches the pre-short-link behavior, which only passed `view` here.
    const longUrlWithView = useShareUrl(RouteResolver.tx(chainId, txHash, view));
    const { register: registerWithView } = useShortShareUrl(longUrlWithView);
    const longUrl = useShareUrl(RouteResolver.tx(chainId, txHash));
    const { url: tipsLink, isPending: isTipsLinkPending, register } = useShortShareUrl(longUrl);

    const likedStatus = autoQuery && isLogin ? data?.has_liked : liked;
    const likeStatusData = useMemo<TipsLikeStatusData>(
        () => ({
            txHash,
            chainId,
            fromAddress,
            isLiked: likedStatus ?? false,
        }),
        [txHash, chainId, fromAddress, likedStatus],
    );

    const addressForMention = view === TipsDetailViewType.Receiver ? fromAddress : toAddress;
    const accountIdForMention = view === TipsDetailViewType.Receiver ? fromAccountId : toAccountId;
    const [{ loading }, handleSharePost] = useAsyncFn(
        async (event: React.MouseEvent) => {
            event.stopPropagation();

            if (!isLogin) {
                openLoginModalWithGuard();
                return;
            }

            const mentionChars = await getMentionCharsByIdentity({
                source: accountIdForMention ? Source.Firefly : Source.Wallet,
                id: accountIdForMention || addressForMention,
            });
            const resolvedTipsLinkWithView = await registerWithView();
            const success = await sharePost(
                {
                    tipsLink: resolvedTipsLinkWithView,
                    tokenSymbol,
                    view,
                },
                addressForMention,
                mentionChars,
            );
            if (success) {
                runInSafeAsync(() =>
                    createTxReaction(TxReactionType.ShareTip, chainId.toString(), txHash, fromAddress),
                );
                updateTipsReactionStatus(txHash, TxReactionType.ShareTip, true);
            }
        },
        [
            txHash,
            tokenSymbol,
            isLogin,
            addressForMention,
            view,
            chainId,
            fromAddress,
            accountIdForMention,
            registerWithView,
        ],
    );

    const repostedStatus = autoQuery && isLogin ? data?.has_reposted : reposted;

    return (
        <div className={classNames('flex items-center justify-between', className)}>
            <div className="flex items-center gap-2 text-secondary">
                <motion.button
                    disabled={loading || isLoading}
                    onClick={handleSharePost}
                    whileTap={{ scale: 0.9 }}
                    className="flex size-7 items-center justify-center"
                >
                    {loading || isLoading ? (
                        <LoadingIcon size={16} />
                    ) : (
                        <MirrorIcon className={repostedStatus ? 'text-secondarySuccess' : ''} width={16} height={16} />
                    )}
                </motion.button>
                <LikeButton type={ExtraLikeType.Tips} data={likeStatusData} />
            </div>

            <MoreActionMenu
                button={
                    <Tooltip content={<Trans>Share</Trans>} placement="top">
                        <span onClick={register} className="inline-flex">
                            <ShareIcon width={16} height={16} className="text-secondary" />
                        </span>
                    </Tooltip>
                }
            >
                <MenuGroup>
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <CopyLinkButton link={tipsLink} onClick={close} pending={isTipsLinkPending}>
                                    <Trans>Copy link</Trans>
                                </CopyLinkButton>
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MenuButton
                                    onClick={() => {
                                        close();
                                        openShareImageModal({
                                            imageUrl: urlcat(SITE_URL, 'api/og/tip/:hash/image', {
                                                hash: txHash,
                                                view,
                                            }),
                                            aspectRatio: '1200 / 630',
                                        });
                                    }}
                                >
                                    <ImageDownloadIcon width={16} height={16} />
                                    <span className="font-bold leading-[22px] text-main">
                                        <Trans>Share image</Trans>
                                    </span>
                                </MenuButton>
                            )}
                        </MenuItem>
                    </>
                </MenuGroup>
            </MoreActionMenu>
        </div>
    );
}
