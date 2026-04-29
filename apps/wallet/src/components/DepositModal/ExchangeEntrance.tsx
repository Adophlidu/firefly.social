import SwitchIcon from '@dimensiondev/assets/swap2.svg';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { memo } from 'react';
import { toast } from 'sonner';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Button } from '@/components/ui/button.js';
import { resolveCoinbaseBuyerUrl } from '@/helpers/resolveCoinbaseBuyerUrl.js';
import { logger } from '@/lib/Logger.js';
import { privyAuthApi } from '@/providers/privy/auth.js';
import { evmWalletAddressAtom } from '@/store/embeddedWallets.js';

const NETWORK = 'ethereum';
const ASSET = 'ETH';

export const ExchangeEntrance = memo(function ExchangeEntrance() {
    const evmAddress = useAtomValue(evmWalletAddressAtom);

    const { mutateAsync, isPending } = useMutation({
        mutationKey: ['buyer-token', evmAddress?.toLowerCase()],
        mutationFn: async () => {
            try {
                if (!evmAddress) return;

                const result = await privyAuthApi.getCoinbaseBuyerToken(evmAddress, NETWORK, ASSET);
                const url = resolveCoinbaseBuyerUrl(result, NETWORK, ASSET);
                window.open(url, '_blank', 'noopener');
            } catch (error) {
                logger.error('Failed to fetch exchange options', error);
                toast.error(
                    error instanceof Error ? (
                        error.message
                    ) : (
                        <Trans>Failed to init exchange options. Please try again later.</Trans>
                    ),
                );
            }
        },
    });

    return (
        <Button
            variant="outline"
            className="hover:bg-lightBg text-main flex h-14 w-full items-center justify-start gap-3"
            disabled={isPending}
            onClick={() => mutateAsync()}
        >
            {isPending ? <LoadingIcon size={24} /> : <SwitchIcon className="text-main size-6" width={24} height={24} />}
            <span className="text-main text-base">
                <Trans>Transfer from an exchange</Trans>
            </span>
        </Button>
    );
});
