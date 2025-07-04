'use client';

import { Trans } from '@lingui/react/macro';
import { ProviderType } from '@okxweb3/dex-widget';

import EVMIcon from '@/assets/evm-chains.svg';
import SolanaIcon from '@/assets/solana.svg';
import {
    FireflyWalletChainSelector,
    type FireflyWalletChainSelectorProps,
} from '@/components/FireflyWallet/FireflyWalletChainSelector.js';

const chains = [
    {
        icon: <EVMIcon />,
        label: <Trans>EVM</Trans>,
        value: ProviderType.EVM,
    },
    {
        icon: <SolanaIcon viewBox="3 3 14 14" />,
        label: <Trans>Solana</Trans>,
        value: ProviderType.SOLANA,
    },
];

export function FireflyWalletChainSelectorWithOkxProviderType({
    ...props
}: Omit<FireflyWalletChainSelectorProps<ProviderType>, 'chains'>) {
    return <FireflyWalletChainSelector chains={chains} {...props} />;
}
