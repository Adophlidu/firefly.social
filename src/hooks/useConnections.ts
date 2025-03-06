import { ChainId as EVMChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useAccount as useEVMAccount, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';

import { NetworkPluginID, NetworkType } from '@/constants/enum.js';
import { formatEthereumAddress, formatSolanaAddress } from '@/helpers/formatAddress.js';
import { formatDomainName } from '@/helpers/formatDomainName.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { useMounted } from '@/hooks/useMounted.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { ConnectModalRef, MyWalletsModalRef } from '@/modals/controls.js';

const evmNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, EVMChainId.Mainnet);
const solanaNetworkDescriptor = getNetworkDescriptor(NetworkPluginID.PLUGIN_SOLANA, SolanaChainId.Mainnet);

export interface Connection {
    type: 'evm' | 'solana';
    icon?: string;
    label: string | null;
    onOpenConnectModal: () => void;
    onOpenAccountModal: () => void;
    isConnected: boolean;
    isLoading: boolean;
}

export function useEVMConnection(): Connection {
    const mounted = useMounted();

    const evmAccount = useEVMAccount();

    const { data: ensName } = useEnsName({ address: evmAccount.address, chainId: mainnet.id });

    // isConnected and isConnecting could both true at the same time
    const isEVMConnected = !!(
        evmAccount.isConnected &&
        !evmAccount.isConnecting &&
        !evmAccount.isReconnecting &&
        evmAccount.address
    );

    return {
        type: 'evm',
        icon: evmNetworkDescriptor?.icon,
        label: resolveValue(() => {
            if (!isEVMConnected || !evmAccount.address || !mounted) return null;
            if (ensName) return formatDomainName(ensName);
            return formatEthereumAddress(evmAccount.address, 4);
        }),
        onOpenConnectModal: () => ConnectModalRef.open({ networkType: NetworkType.Ethereum }),
        onOpenAccountModal: () => MyWalletsModalRef.open(),
        isConnected: isEVMConnected,
        isLoading: evmAccount.isConnecting,
    };
}

export function useSolanaConnection(): Connection {
    const walletProvider = useSolanaWalletProvider();
    const { connection } = useAppKitConnection();

    return {
        type: 'solana',
        icon: solanaNetworkDescriptor?.icon,
        label: resolveValue(() => {
            if (!walletProvider?.publicKey) return null;
            const address = walletProvider.publicKey.toBase58();
            return formatSolanaAddress(address, 4);
        }),
        onOpenConnectModal: () => ConnectModalRef.open({ networkType: NetworkType.Solana }),
        onOpenAccountModal: () => MyWalletsModalRef.open(),
        isConnected: !!connection,
        isLoading: false,
    };
}

export function useConnections(): Connection[] {
    const evm = useEVMConnection();
    const solana = useSolanaConnection();

    return [evm, solana];
}
