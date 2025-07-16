'use client';

import { Trans } from '@lingui/react/macro';

import EVMIcon from '@/assets/evm-chains.svg';
import SolanaIcon from '@/assets/solana.svg';
import {
    FireflyWalletChainSelector,
    type FireflyWalletChainSelectorProps,
} from '@/components/FireflyWallet/FireflyWalletChainSelector.js';
import { OkxProviderType } from '@/constants/enum.js';

const chains = [
    {
        icon: <EVMIcon />,
        label: <Trans>EVM</Trans>,
        value: OkxProviderType.EVM,
    },
    {
        icon: <SolanaIcon viewBox="3 3 14 14" />,
        label: <Trans>Solana</Trans>,
        value: OkxProviderType.SOLANA,
    },
];

export function FireflyWalletChainSelectorWithOkxProviderType({
    ...props
}: Omit<FireflyWalletChainSelectorProps<OkxProviderType>, 'chains'>) {
    return <FireflyWalletChainSelector chains={chains} {...props} />;
}
