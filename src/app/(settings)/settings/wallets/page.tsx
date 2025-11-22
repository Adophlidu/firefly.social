'use client';

import { delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { AddWalletButton } from '@/app/(settings)/components/AddWalletButton.js';
import { SettingsSection } from '@/app/(settings)/components/Section.js';
import { WalletGroup } from '@/app/(settings)/components/WalletGroup.js';
import EvmIcon from '@/assets/evm.svg';
import SolanaIcon from '@/assets/solana.svg';
import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';

export default function Wallets() {
    const isLogin = useIsLoginFirefly();

    const {
        data: { connected = EMPTY_LIST, evmConnections = EMPTY_LIST, solanaConnections = EMPTY_LIST } = {},
        isLoading,
        isRefetching,
        refetch,
    } = useAllConnections();

    return (
        <SettingsSection title={<Trans>Connected wallets</Trans>}>
            {!isLogin ? (
                <NotLoginFallback source={Source.Posts} />
            ) : (
                <>
                    {!isLoading && evmConnections.length === 0 && solanaConnections.length === 0 ? (
                        <NoResultsFallback message={<Trans>No available wallet.</Trans>} />
                    ) : null}
                    {isLoading ? <Loading className="!min-h-[200px]" /> : null}
                    <WalletGroup
                        title={
                            <span className="inline-flex items-center">
                                <Trans>
                                    <EvmIcon width={20} height={20} className="mr-2 size-5 shrink-0" />
                                    EVM wallets
                                </Trans>
                            </span>
                        }
                        connections={evmConnections}
                    />
                    <WalletGroup
                        title={
                            <span className="inline-flex items-center">
                                <SolanaIcon width={20} height={20} className="mr-2 size-5 shrink-0" />
                                <Trans>Solana wallets</Trans>
                            </span>
                        }
                        connections={solanaConnections}
                    />
                    {!isLoading ? (
                        <div className="flex w-full justify-center">
                            <AddWalletButton
                                openWallets
                                connections={connected}
                                disabled={isRefetching}
                                onSuccess={async () => {
                                    await delay(1000);
                                    await refetch();
                                }}
                            />
                        </div>
                    ) : null}
                </>
            )}
        </SettingsSection>
    );
}
