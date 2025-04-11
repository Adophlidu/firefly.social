'use client';

import { msg, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';

import { AddWalletButton } from '@/app/(settings)/components/AddWalletButton.js';
import { Headline } from '@/app/(settings)/components/Headline.js';
import { Section } from '@/app/(settings)/components/Section.js';
import { WalletGroup } from '@/app/(settings)/components/WalletGroup.js';
import EvmIcon from '@/assets/evm.svg';
import SolanaIcon from '@/assets/solana.svg';
import { Loading } from '@/components/Loading.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useNavigatorTitle } from '@/hooks/useNavigatorTitle.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export default function Wallets() {
    const isLogin = useIsLoginFirefly();
    useNavigatorTitle(msg`Connected wallets`);

    const {
        data: { connected = EMPTY_LIST, evmConnections = EMPTY_LIST, solanaConnections = EMPTY_LIST } = {},
        isLoading,
        isRefetching,
        refetch,
    } = useQuery({
        queryKey: ['my-wallet-connections'],
        queryFn: () => FireflyEndpointProvider.getAllConnectionsFormatted(),
        enabled: isLogin,
    });

    return (
        <Section className="max-h-screen overflow-y-auto">
            <Headline>
                <Trans>Connected wallets</Trans>
                {isRefetching ? <LoadingIcon className="ml-1 inline-block" size={20} /> : null}
            </Headline>
            {!isLogin ? (
                <NotLoginFallback source={Source.Posts} />
            ) : (
                <>
                    {!isLoading && evmConnections.length === 0 && solanaConnections.length === 0 ? (
                        <NoResultsFallback message={t`No available wallet.`} />
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
                                <Trans>
                                    <SolanaIcon width={20} height={20} className="mr-2 size-5 shrink-0" />
                                    Solana wallets
                                </Trans>
                            </span>
                        }
                        connections={solanaConnections}
                    />
                    {!isLoading ? (
                        <div className="flex w-full justify-center">
                            <AddWalletButton
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
        </Section>
    );
}
