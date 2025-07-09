'use client';

import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
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
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SITE_URL } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { useChangeSwapLikeStatus } from '@/hooks/useChangeSwapLikeStatus.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { LoginModalRef, ShareImageModalRef } from '@/modals/controls.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';

interface SwapTransactionActionsProps {
    activity: SwapActivity;
    className?: string;
}

export function SwapTransactionActions({ activity, className }: SwapTransactionActionsProps) {
    const isLogin = useIsLoginFirefly();
    const { mutate: onLikeChange, isPending } = useChangeSwapLikeStatus(activity);

    return (
        <div className={classNames('mt-2 flex items-center justify-between gap-2', className)}>
            <SwapButton
                className="!ml-0 flex !px-2 py-[2px] !text-[12px] !font-medium !leading-[20px]"
                swapProps={{
                    chainId: activity.chain_id,
                    fromToken: activity.from_token?.address,
                    toToken: activity.to_token?.address,
                }}
            >
                <Trans>Copy Trade</Trans>
            </SwapButton>
            <div className="flex items-center gap-2 text-secondary">
                <motion.button whileTap={{ scale: 0.9 }} className="flex h-7 w-7 items-center justify-center">
                    <MirrorIcon width={16} height={16} />
                </motion.button>
                <motion.button
                    disabled={isPending}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-7 w-7 items-center justify-center"
                    onClick={() => {
                        if (!isLogin) {
                            LoginModalRef.open();
                            return;
                        }
                        onLikeChange();
                    }}
                >
                    {isPending ? (
                        <LoadingIcon size={16} />
                    ) : activity.is_like ? (
                        <LikedIcon width={16} height={16} />
                    ) : (
                        <LikeIcon width={16} height={16} />
                    )}
                </motion.button>
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
                                    <CopyLinkButton link={`/tx/${activity.chain_id}/${activity.hash}`} onClick={close}>
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
                                                imageUrl: urlcat(SITE_URL, 'api/og/swap/:chainId/:hash/image', {
                                                    chainId: activity.chain_id,
                                                    hash: activity.hash,
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
        </div>
    );
}
