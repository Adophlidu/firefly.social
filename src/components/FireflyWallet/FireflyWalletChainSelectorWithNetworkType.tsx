'use client';

import { Trans } from '@lingui/react/macro';

import EVMIcon from '@/assets/evm-chains.svg';
import SolanaIcon from '@/assets/solana.svg';
import {
    FireflyWalletChainSelector,
    type FireflyWalletChainSelectorProps,
} from '@/components/FireflyWallet/FireflyWalletChainSelector.js';
import { NetworkType } from '@/constants/enum.js';

const chains = [
    {
        icon: <EVMIcon />,
        label: <Trans>EVM</Trans>,
        value: NetworkType.Ethereum,
    },
    {
        icon: <SolanaIcon viewBox="3 3 14 14" />,
        label: <Trans>Solana</Trans>,
        value: NetworkType.Solana,
    },
];

export function FireflyWalletChainSelectorWithNetworkType({
    ...props
}: Omit<FireflyWalletChainSelectorProps<NetworkType>, 'chains'>) {
    return <FireflyWalletChainSelector chains={chains} {...props} />;
}
