'use client';

import { NetworkType } from '@dimensiondev/enums';
import { getChainIcon, solana } from '@dimensiondev/web3/chains';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { mainnet } from 'viem/chains';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useVerifyAndBindWallet } from '@/hooks/useVerifyAndBindWallet.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface Props {
    onClose: (reason: Error) => void;
    onConfirm: (result: BindWalletResponse['data']) => void;
    connections: FireflyWalletConnection[];
}

const SelectNetworkModalUI = memo<Props>(function SelectChainModalUI({ connections, onClose, onConfirm }) {
    const [{ loading }, onBind] = useVerifyAndBindWallet(
        connections,
        (result) => {
            onConfirm(result);
        },
        (error) => {
            onClose(error);
        },
    );

    if (loading)
        return (
            <div className="flex h-[156px] items-center justify-center">
                <LoadingIcon />
            </div>
        );

    return (
        <div className="text-second grid grid-cols-1 gap-3 p-4 text-sm font-bold leading-5 md:grid-cols-2">
            {[
                {
                    icon: getChainIcon(mainnet.id),
                    label: <Trans>EVM</Trans>,
                    type: NetworkType.Ethereum,
                },
                {
                    icon: getChainIcon(solana.id),
                    label: <Trans>Solana</Trans>,
                    type: NetworkType.Solana,
                },
            ].map((chainType) => {
                return (
                    <ClickableButton
                        key={chainType.type}
                        className="hover:bg-lightBg hover:text-main flex flex-col items-center gap-2 rounded-md px-4 py-6"
                        onClick={() => onBind(chainType.type)}
                    >
                        <Image
                            src={chainType.icon ?? ''}
                            width={48}
                            height={48}
                            alt={chainType.type}
                            className="size-12"
                        />
                        <span>{chainType.label}</span>
                    </ClickableButton>
                );
            })}
        </div>
    );
});

export default SelectNetworkModalUI;
