import { BlockchainIds, createSignMessageText } from '@dialectlabs/blinks';
import { useEvmWagmiAdapter } from '@dialectlabs/blinks/hooks/evm';
import { BlinkSolanaConfig } from '@dialectlabs/blinks-core/solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { useMemo } from 'react';

import { chains } from '@/configs/wagmiClient.js';
import { decodeBase64 } from '@/helpers/decodeBase64.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { ConnectModalRef } from '@/modals/controls.js';

export function useActionAdapter() {
    const { adapter: evmAdapter } = useEvmWagmiAdapter({
        async onConnectWalletRequest() {
            await ConnectModalRef.openAndWaitForClose();
        },
    });
    const { connection } = useAppKitConnection();
    const walletProvider = useSolanaWalletProvider();
    const solanaAdapter = useMemo(() => {
        return new BlinkSolanaConfig(connection ?? getSolanaRPCUrl(), {
            async signMessage(data) {
                if (!walletProvider) {
                    await ConnectModalRef.openAndWaitForClose();
                    return { error: 'Connection error' };
                }
                const text = typeof data === 'string' ? data : createSignMessageText(data);
                const encoded = new TextEncoder().encode(text);
                const signed = await walletProvider?.signMessage(encoded);
                const encodedSignature = bs58.encode(signed);
                return { signature: encodedSignature };
            },
            async signTransaction(txData) {
                try {
                    if (!walletProvider) {
                        await ConnectModalRef.openAndWaitForClose();
                        return { error: 'Connection error' };
                    }
                    const tx = await walletProvider?.signAndSendTransaction(
                        VersionedTransaction.deserialize(decodeBase64(txData)),
                    );
                    return { signature: tx };
                } catch {
                    return { error: 'Signing failed.' };
                }
            },
            async connect() {
                await ConnectModalRef.openAndWaitForClose();
                return null;
            },
        });
    }, [connection, walletProvider]);

    return useMemo(() => {
        return new BlinkSolanaConfig(connection ?? getSolanaRPCUrl(), {
            async signMessage(data, context) {
                const isEVM = context.action.metadata.blockchainIds?.some((x) => x.startsWith('eip155:'));
                if (isEVM) {
                    return evmAdapter.signMessage(data, context);
                }
                return solanaAdapter.signMessage(data, context);
            },
            async signTransaction(txData, context) {
                const isEVM = context.action.metadata.blockchainIds?.some((x) => x.startsWith('eip155:'));
                if (isEVM) {
                    return evmAdapter.signMessage(txData, context);
                }
                return solanaAdapter.signTransaction(txData, context);
            },
            async connect() {
                await ConnectModalRef.openAndWaitForClose();
                return null;
            },
            metadata: {
                supportedBlockchainIds: [
                    BlockchainIds.ETHEREUM_MAINNET,
                    BlockchainIds.ETHEREUM_SEPOLIA,
                    BlockchainIds.SOLANA_MAINNET,
                    BlockchainIds.SOLANA_TESTNET,
                    BlockchainIds.SOLANA_DEVNET,
                    // EVM CAIP2
                    ...chains.map((x) => `eip155:${x.id}`),
                ],
            },
        });
    }, [connection, evmAdapter, solanaAdapter]);
}
