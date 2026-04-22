import PolymarketV2MigrationIcon from '@dimensiondev/assets/wallet/v2-migration.svg';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Address } from 'viem';

import { BetNavigationBar } from '@/components/Bet/BetNavigationBar.js';
import { Button } from '@/components/ui/button.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

interface V2UpgradeModalProps {
    proxyAddress: Address;
}

export function V2UpgradeModal({ proxyAddress }: V2UpgradeModalProps) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => getFireflyEndpoint().polymarketV2Upgrade(proxyAddress),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['polymarket-upgrade-task', proxyAddress] }),
                queryClient.invalidateQueries({ queryKey: ['getPolymarketAccount'] }),
                queryClient.invalidateQueries({
                    queryKey: ['polymarket-withdrawable-amount', proxyAddress],
                }),
            ]);
        },
    });

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center">
            <BetNavigationBar hideActions />
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 p-6">
                <PolymarketV2MigrationIcon width={88} height={88} className="shrink-0" />

                <div className="flex flex-col items-center gap-2 text-center">
                    <h2 className="text-main text-lg font-semibold leading-normal">
                        <Trans>Migrate to Polymarket V2</Trans>
                    </h2>

                    <p className="text-second w-full px-5 text-sm font-medium leading-[18px]">
                        <Trans>
                            Upgrade your Firefly prediction account NOW to ensure your predictions continue seamlessly.
                        </Trans>
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    className="h-12 w-full rounded-full"
                    disabled={mutation.isSuccess}
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate()}
                >
                    {mutation.isSuccess ? (
                        <Trans>Done</Trans>
                    ) : mutation.isError ? (
                        <Trans>Failed to upgrade</Trans>
                    ) : (
                        <Trans>Upgrade Now</Trans>
                    )}
                </Button>
            </div>
        </div>
    );
}
