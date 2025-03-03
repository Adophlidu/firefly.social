import { type BlinkExecutionContext, BlockchainIds, createSignMessageText } from '@dialectlabs/blinks';
import { useEvmWagmiAdapter } from '@dialectlabs/blinks/hooks/evm';
import { BlinkSolanaConfig } from '@dialectlabs/blinks-core/solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { useMemo } from 'react';

import { chains } from '@/configs/wagmiClient.js';
import { decodeBase64 } from '@/helpers/decodeBase64.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { ConnectModalRef } from '@/modals/controls.js';
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';

export function useActionAdapter() {
    const { adapter: evmAdapter } = useEvmWagmiAdapter({
        async onConnectWalletRequest() {
            await ConnectModalRef.openAndWaitForClose();
        },
    });
    const { connection } = useAppKitConnection();
    const solanaAdapter = useMemo(() => {
        return new BlinkSolanaConfig(connection ?? getSolanaRPCUrl(), {
            async signMessage(data) {
                const adapter = getWalletAdaptorConnected();
                const text = typeof data === 'string' ? data : createSignMessageText(data);
                const encoded = new TextEncoder().encode(text);
                const signed = await adapter.signMessage(encoded);
                const encodedSignature = bs58.encode(signed);
                return { signature: encodedSignature };
            },
            async signTransaction(txData) {
                try {
                    const adapter = getWalletAdaptorConnected();
                    const tx = await adapter.signAndSendTransaction(
                        VersionedTransaction.deserialize(decodeBase64(txData)),
                    );
                    return { signature: tx };
                } catch {
                    return { error: 'Signing failed.' };
                }
            },
            async connect() {
                try {
                    const adapter = getWalletAdaptorConnected();
                    return adapter?.publicKey?.toBase58() ?? null;
                } catch {
                    await ConnectModalRef.openAndWaitForClose();
                    return null;
                }
            },
        });
    }, [connection]);

    return useMemo(() => {
        const isEVM = (context: BlinkExecutionContext) =>
            context.action.metadata.blockchainIds?.some((x) => x.startsWith('eip155:'));

        return new BlinkSolanaConfig(connection ?? getSolanaRPCUrl(), {
            async signMessage(data, context) {
                if (isEVM(context)) evmAdapter.signMessage(data, context);
                return solanaAdapter.signMessage(data, context);
            },
            async signTransaction(txData, context) {
                if (isEVM(context)) return evmAdapter.signMessage(txData, context);
                return solanaAdapter.signTransaction(txData, context);
            },
            async connect(context) {
                if (isEVM(context)) return evmAdapter.connect(context);
                return solanaAdapter.connect(context);
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
