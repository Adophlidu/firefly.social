'use client';

import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import type { HTMLProps } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import ImageDownloadIcon from '@/assets/image-download.svg';
import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import MirrorIcon from '@/assets/mirror.svg';
import ShareIcon from '@/assets/share.svg';
import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Source, TipsDetailViewType, TipsNotificationType, TxReactionType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getMentionCharsByIdentity } from '@/helpers/getMentionCharsByIdentity.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { updateTipsReactionStatus } from '@/helpers/updateTipsReactionStatus.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useToggleTipLikeStatus } from '@/hooks/useToggleTipLikeStatus.js';
import { type ComposeModalOpenProps, ComposeModalRef } from '@/modals/ComposeModal.js';
import { ShareImageModalRef } from '@/modals/ShareImageModal/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { type MentionChars } from '@/types/chars.js';

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
        txHash,
        tokenSymbol,
        view,
        chainId,
    }: {
        txHash: string;
        tokenSymbol: string;
        view?: TipsDetailViewType;
        chainId: number;
    },
    addressForMention: string,
    mentionChars: MentionChars | null,
) {
    const tipsLink = RouteResolver.tx(chainId, txHash, view);
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

    const result = await ComposeModalRef.openAndWaitForClose(options);
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
            return FireflyEndpointProvider.getTipsTransactionDetail(txHash, TipsNotificationType.Tip);
        },
    });

    const likedStatus = autoQuery && isLogin ? data?.has_liked : liked;
    const repostedStatus = autoQuery && isLogin ? data?.has_reposted : reposted;

    const { mutateAsync, isPending } = useToggleTipLikeStatus({
        txHash,
        chainId,
        fromAddress,
        liked: likedStatus ?? false,
    });

    const addressForMention = view === TipsDetailViewType.Receiver ? fromAddress : toAddress;
    const accountIdForMention = view === TipsDetailViewType.Receiver ? fromAccountId : toAccountId;

    const [{ loading }, handleSharePost] = useAsyncFn(
        async (event: React.MouseEvent) => {
            event.stopPropagation();

            if (!isLogin) {
                openLoginModal();
                return;
            }

            const mentionChars = await getMentionCharsByIdentity({
                source: accountIdForMention ? Source.Firefly : Source.Wallet,
                id: accountIdForMention || addressForMention,
            });
            const success = await sharePost(
                {
                    txHash,
                    tokenSymbol,
                    view,
                    chainId,
                },
                addressForMention,
                mentionChars,
            );
            if (success) {
                runInSafeAsync(() =>
                    FireflyEndpointProvider.createTxReaction(
                        TxReactionType.ShareTip,
                        chainId.toString(),
                        txHash,
                        fromAddress,
                    ),
                );
                updateTipsReactionStatus(txHash, TxReactionType.ShareTip, true);
            }
        },
        [txHash, tokenSymbol, isLogin, addressForMention, view, chainId, fromAddress, accountIdForMention],
    );

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
                <motion.button
                    disabled={isLoading || isPending}
                    whileTap={{ scale: 0.9 }}
                    className="flex size-7 items-center justify-center"
                    onClick={async (event) => {
                        event.stopPropagation();

                        if (!isLogin) {
                            openLoginModal();
                            return;
                        }

                        if (isLoading || isPending) return;
                        await mutateAsync();
                    }}
                >
                    {isLoading || isPending ? (
                        <LoadingIcon size={16} />
                    ) : likedStatus ? (
                        <LikedIcon width={16} height={16} />
                    ) : (
                        <LikeIcon width={16} height={16} />
                    )}
                </motion.button>
            </div>

            <MoreActionMenu
                button={
                    <Tooltip content={<Trans>Share</Trans>} placement="top">
                        <ShareIcon width={16} height={16} className="text-secondary" />
                    </Tooltip>
                }
            >
                <MenuGroup>
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <CopyLinkButton link={RouteResolver.tx(chainId, txHash)} onClick={close}>
                                    <Trans>Copy link</Trans>
                                </CopyLinkButton>
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MenuButton
                                    onClick={() => {
                                        close();
                                        ShareImageModalRef.open({
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
