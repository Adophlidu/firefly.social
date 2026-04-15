'use client';

import StarFilledIcon from '@dimensiondev/assets/star-filled.svg';
import StarOutlineIcon from '@dimensiondev/assets/star-outline.svg';
import { classNames } from '@dimensiondev/utils';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import type { ConnectionPlatform } from '@/constants/enum.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatAddressEthereum, formatAddressSolana } from '@/helpers/formatAddress.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function PrimaryButton({
    platform,
    isDefault,
    platformId,
    tooltipContent,
    profile,
}: {
    platform: ConnectionPlatform;
    platformId: string | number;
    isDefault?: boolean;
    tooltipContent: ReactNode;
    profile?: Profile;
}) {
    const queryClient = useQueryClient();
    const [{ loading }, onSetPrimary] = useAsyncFn(async () => {
        await fireflyWalletProvider.updateDefaultConnection(platformId, platform);
        await queryClient.refetchQueries({ queryKey: ['all-profiles'] });
        await queryClient.refetchQueries({ queryKey: ['allConnections'] });
        if (profile?.handle) {
            enqueueSuccessMessage(<Trans>Set @{profile.handle} as primary account</Trans>);
            return;
        }
        if (typeof platformId === 'string') {
            if (isValidAddressEthereum(platformId)) {
                const formattedAddress = formatAddressEthereum(platformId, 4);
                enqueueSuccessMessage(<Trans>Set {formattedAddress} as primary EVM wallet</Trans>);
                return;
            }
            if (isValidAddressSolana(platformId)) {
                const formattedAddress = formatAddressSolana(platformId, 4);
                enqueueSuccessMessage(<Trans>Set {formattedAddress} as primary Solana wallet</Trans>);
                return;
            }
        }
    }, [platformId, platform, queryClient, profile?.handle]);

    return (
        <Tooltip content={tooltipContent} placement="top">
            <ClickableButton
                className={classNames('size-5 shrink-0', {
                    'cursor-pointer': !isDefault,
                })}
                disabled={loading}
                onClick={() => {
                    if (isDefault) return;
                    onSetPrimary();
                }}
            >
                {loading ? (
                    <LoadingIcon size={20} />
                ) : isDefault ? (
                    <StarFilledIcon width={20} height={20} className="text-warn shrink-0" />
                ) : (
                    <StarOutlineIcon width={20} height={20} className="text-second shrink-0" />
                )}
            </ClickableButton>
        </Tooltip>
    );
}
