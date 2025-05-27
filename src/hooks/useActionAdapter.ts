import { web3 } from '@coral-xyz/anchor';
import { type BlinkExecutionContext, BlockchainIds, createSignMessageText } from '@dialectlabs/blinks';
import { useEvmWagmiAdapter } from '@dialectlabs/blinks/hooks/evm';
import { BlinkSolanaConfig } from '@dialectlabs/blinks-core/solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import bs58 from 'bs58';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { chains } from '@/configs/wagmiClient.js';
import { decodeBase64 } from '@/helpers/decodeBase64.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';
import {
    captureBlinkActionEvent,
    captureBlinkActionSignMessageEvent,
} from '@/providers/telemetry/captureBlinkActionEvent.js';

type BlinkSolanaConnection = ConstructorParameters<typeof BlinkSolanaConfig>[0];

export function useActionAdapter() {
    const { adapter: evmAdapter } = useEvmWagmiAdapter({
        async onConnectWalletRequest() {
            await WalletConnectModalRef.openAndWaitForClose();
        },
    });
    const { connection } = useAppKitConnection();
    const account = useAccount();
    const solanaAdapter = useMemo(() => {
        return new BlinkSolanaConfig((connection ?? getSolanaRPCUrl()) as BlinkSolanaConnection, {
            async signMessage(data) {
                const adapter = getWalletAdaptorConnected();
                const text = typeof data === 'string' ? data : createSignMessageText(data);
                const encoded = new TextEncoder().encode(text);
                const signed = await adapter.signMessage(encoded);
                const encodedSignature = bs58.encode(signed);
                await captureBlinkActionSignMessageEvent(adapter.publicKey.toBase58());
                return { signature: encodedSignature };
            },
            async signTransaction(txData) {
                try {
                    const adapter = getWalletAdaptorConnected();
                    const tx = await adapter.signAndSendTransaction(
                        web3.VersionedTransaction.deserialize(decodeBase64(txData)),
                    );
                    await captureBlinkActionEvent(adapter.publicKey.toBase58());
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
                    await WalletConnectModalRef.openAndWaitForClose();
                    return null;
                }
            },
        });
    }, [connection]);

    return useMemo(() => {
        const isEVM = (context: BlinkExecutionContext) =>
            context.action.metadata.blockchainIds?.some((x) => x.startsWith('eip155:'));

        return new BlinkSolanaConfig((connection ?? getSolanaRPCUrl()) as BlinkSolanaConnection, {
            async signMessage(data, context) {
                if (isEVM(context)) {
                    if (account.address) captureBlinkActionSignMessageEvent(account.address);
                    evmAdapter.signMessage(data, context);
                }
                return solanaAdapter.signMessage(data, context);
            },
            async signTransaction(txData, context) {
                if (isEVM(context)) {
                    if (account.address) captureBlinkActionEvent(account.address);
                    return evmAdapter.signMessage(txData, context);
                }
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
    }, [account.address, connection, evmAdapter, solanaAdapter]);
}
