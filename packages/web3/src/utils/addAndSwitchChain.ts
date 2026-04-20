import type { Config } from 'wagmi';
import { getConnectorClient } from 'wagmi/actions';

export async function addAndSwitchChain(config: Config, chainId: number) {
    const chain = config.chains.find((c) => c.id === chainId);
    if (!chain) {
        throw new Error(`Chain ${chainId} is not configured in wagmi config`);
    }

    const client = await getConnectorClient(config);
    const provider = client.transport;

    if (provider.type !== 'custom' || !provider.request) {
        throw new Error('Connector does not support provider.request');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
        });
        return;
    } catch (error: unknown) {
        const connectionError = error as { code: number; message: string };
        const isChainNotAdded =
            connectionError?.code === 4902 || connectionError?.message?.toLowerCase().includes('unrecognized chain');

        if (!isChainNotAdded) {
            throw error;
        }
    }

    await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
            {
                chainId: chainIdHex,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: chain.rpcUrls.default.http,
                blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : undefined,
            },
        ],
    });

    await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
    });
}
