'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';
import { mainnet } from 'viem/chains';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { useVerifyAndBindWallet } from '@/hooks/useVerifyAndBindWallet.js';
import type { BindWalletResponse, FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface Props {
    onClose: (reason: Error) => void;
    onConfirm: (result: BindWalletResponse['data']) => void;
    connections: FireflyWalletConnection[];
}

const SelectNetworkModalUI = memo<Props>(function SelectChainModalUI({ connections, onClose, onConfirm }) {
    const evmNetworkDescriptor = useMemo(() => getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, mainnet.id), []);
    const solanaNetworkDescriptor = useMemo(
        () => getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet),
        [],
    );

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
                    icon: evmNetworkDescriptor?.icon,
                    label: <Trans>EVM</Trans>,
                    type: NetworkType.Ethereum,
                },
                {
                    icon: solanaNetworkDescriptor?.icon,
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
