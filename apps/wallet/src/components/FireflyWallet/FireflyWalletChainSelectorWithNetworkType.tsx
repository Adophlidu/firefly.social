import EVMIcon from '@dimensiondev/assets/evm-chains.svg';
import SolanaIcon from '@dimensiondev/assets/solana.colored.svg';
import { NetworkType } from '@dimensiondev/web3/enums';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import {
    FireflyWalletChainSelector,
    type FireflyWalletChainSelectorProps,
} from '@/components/FireflyWallet/FireflyWalletChainSelector.js';

export function FireflyWalletChainSelectorWithNetworkType({
    ...props
}: Omit<FireflyWalletChainSelectorProps<NetworkType>, 'chains'>) {
    const chains = useMemo(
        () => [
            {
                icon: <EVMIcon />,
                label: <Trans>EVM</Trans>,
                value: NetworkType.Ethereum,
            },
            {
                icon: <SolanaIcon />,
                label: <Trans>Solana</Trans>,
                value: NetworkType.Solana,
            },
        ],
        [],
    );

    return <FireflyWalletChainSelector chains={chains} {...props} />;
}
