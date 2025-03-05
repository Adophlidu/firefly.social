'use client';

import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useAsyncFn } from 'react-use';

import StarFilledIcon from '@/assets/star-filled.svg';
import StarOutlineIcon from '@/assets/star-outline.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { DefaultConnectionPlatform } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { WalletConnection } from '@/providers/types/Firefly.js';

const resolveDefaultConnectionPlatform = createLookupTableResolver<
    WalletConnection['platform'],
    DefaultConnectionPlatform
>(
    {
        eth: DefaultConnectionPlatform.Wallet,
        solana: DefaultConnectionPlatform.Solana,
    },
    (platform) => {
        throw new UnreachableError('platform', platform);
    },
);

export function WalletPrimaryButton({ connection }: { connection: WalletConnection }) {
    const queryClient = useQueryClient();
    const [{ loading }, onSetPrimary] = useAsyncFn(async () => {
        const platform = resolveDefaultConnectionPlatform(connection.platform);
        await FireflyEndpointProvider.updateDefaultConnection(connection.address, platform);
        await queryClient.refetchQueries({ queryKey: ['my-wallet-connections'] });
    }, [connection.address, connection.platform, queryClient]);

    if (connection.isDefault) {
        return (
            <Tooltip content={<Trans>Primary wallet</Trans>} placement="top">
                <ClickableButton className="h-5 w-5 shrink-0" disabled={loading} onClick={() => onSetPrimary()}>
                    {loading ? (
                        <LoadingIcon size={20} />
                    ) : (
                        <StarFilledIcon width={20} height={20} className="shrink-0 text-warn" />
                    )}
                </ClickableButton>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={<Trans>Set as primary wallet</Trans>} placement="top">
            <ClickableButton className="h-5 w-5 shrink-0" disabled={loading} onClick={() => onSetPrimary()}>
                {loading ? (
                    <LoadingIcon size={20} />
                ) : (
                    <StarOutlineIcon width={20} height={20} className="shrink-0 text-second" />
                )}
            </ClickableButton>
        </Tooltip>
    );
}
