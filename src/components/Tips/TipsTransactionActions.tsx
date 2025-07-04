'use client';

import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { compact } from 'lodash-es';
import type { HTMLProps } from 'react';
import { useAsyncFn } from 'react-use';

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
import { queryClient } from '@/configs/queryClient.js';
import { FireflyPlatform, Source, TipsDetailViewType, TipsNotificationType } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { CHAR_TAG, type MentionChars } from '@/helpers/chars.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useToggleTipLikeStatus } from '@/hooks/useToggleTipLikeStatus.js';
import { ComposeModalRef, LoginModalRef, ShareImageModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';

interface TipsTransactionActionsProps extends HTMLProps<HTMLDivElement> {
    txHash: string;
    tokenSymbol: string;
    fromAddress: string;
    toAddress: string;
    chainId: number;
    autoQuery?: boolean;
    liked?: boolean;
    view?: TipsDetailViewType;
}

function sharePost(
    {
        txHash,
        tokenSymbol,
        view,
    }: {
        txHash: string;
        tokenSymbol: string;
        view?: TipsDetailViewType;
    },
    addressForMention: string,
    mentionProfiles?: FireflyProfile[],
) {
    const tipsLink = RouteResolver.tip(txHash, view);
    const sources = getCurrentAvailableSources();
    const validProfiles = compact(
        sources.map((source) => mentionProfiles?.find((profile) => profile.identity.source === source)),
    );
    const mentionNode = !validProfiles.length
        ? formatAddress(addressForMention, 4)
        : ({
              tag: CHAR_TAG.MENTION,
              visible: true,
              content: `@${validProfiles[0].displayName}`,
              profiles: compact(
                  validProfiles.map((profile) => {
                      const source = profile.identity.source;
                      const platform = source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(source);
                      if (!platform) return null;

                      return {
                          platform_id: profile.identity.id,
                          platform,
                          handle: profile.displayName,
                          name: profile.displayName,
                          hit: true,
                          score: 1,
                      };
                  }),
              ),
          } satisfies MentionChars);

    if (view === TipsDetailViewType.Receiver) {
        ComposeModalRef.open({
            chars: ['Thanks ', mentionNode, ', appreciate your tip via ', FIREFLY_MENTION, ' ! 💜\r\n', tipsLink],
        });
        return;
    }

    ComposeModalRef.open({
        chars: [
            'Hi ',
            mentionNode,
            `, sent you some $${tokenSymbol} via `,
            FIREFLY_MENTION,
            ' ✨ Keep shining!\r\n',
            tipsLink,
        ],
    });
    return;
}

export function TipsTransactionActions({
    txHash,
    liked,
    view,
    tokenSymbol,
    fromAddress,
    toAddress,
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
    const { mutateAsync, isPending } = useToggleTipLikeStatus({
        txHash,
        chainId,
        fromAddress,
        liked: likedStatus ?? false,
    });

    const addressForMention = view === TipsDetailViewType.Receiver ? fromAddress : toAddress;
    const [{ loading }, handleSharePost] = useAsyncFn(async () => {
        if (!isLogin) {
            LoginModalRef.open();
            return;
        }

        const fireflyProfiles = await queryClient.fetchQuery<FireflyProfile[]>({
            queryKey: ['wallet-related-profiles', addressForMention],
            staleTime: 1000 * 60 * 60, // 1 hour
            queryFn: () =>
                FireflyEndpointProvider.getAllPlatformProfileByIdentity(
                    {
                        source: Source.Wallet,
                        id: addressForMention,
                    },
                    false,
                ),
        });
        const mentionProfiles = compact(
            SORTED_SOCIAL_SOURCES.map((x) => {
                const defaultProfile = fireflyProfiles.find(
                    (profile) => profile.identity.source === x && profile.isDefault,
                );
                if (defaultProfile) return defaultProfile;

                return fireflyProfiles.find((profile) => profile.identity.source === x) || null;
            }),
        );
        sharePost(
            {
                txHash,
                tokenSymbol,
                view,
            },
            addressForMention,
            mentionProfiles,
        );
    }, [txHash, tokenSymbol, isLogin, addressForMention, view]);

    return (
        <div className={classNames('flex items-center justify-between', className)}>
            <div className="flex items-center gap-2 text-secondary">
                <motion.button
                    disabled={loading}
                    onClick={handleSharePost}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-7 w-7 items-center justify-center"
                >
                    {loading ? <LoadingIcon size={16} /> : <MirrorIcon width={16} height={16} />}
                </motion.button>
                <motion.button
                    disabled={isLoading || isPending}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-7 w-7 items-center justify-center"
                    onClick={async () => {
                        if (!isLogin) {
                            LoginModalRef.open();
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
                                <CopyLinkButton link={RouteResolver.tip(txHash)} onClick={close}>
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
                                            // TODO: Replace with actual image URL
                                            imageUrl: 'https://media.firefly.land/advertisement/download.png',
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
