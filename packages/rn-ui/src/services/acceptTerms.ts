import { fetchJson } from '@/helpers/fetchJson';
import { parseSignature } from '@/helpers/parseSignature';
import type { WalletClient } from '@/types/ui';

export async function acceptTerms(walletClient: WalletClient, address: string) {
    const time = Date.now();
    const signature = await walletClient.signTypedData({
        domain: {
            name: 'HyperliquidSignTransaction',
            version: '1',
            chainId: 42161,
            verifyingContract: '0x0000000000000000000000000000000000000000',
        },
        message: { type: 'acceptTerms', time, signatureChainId: '0xa4b1', hyperliquidChain: 'Mainnet' },
        primaryType: 'Hyperliquid:AcceptTerms',
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ],
            'Hyperliquid:AcceptTerms': [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'time', type: 'uint64' },
            ],
        },
    });
    const parsed = parseSignature(signature);

    await fetchJson('https://api-ui.hyperliquid.xyz/info', {
        method: 'POST',
        body: JSON.stringify({
            signature: parsed,
            signatureChainId: '0xa4b1',
            time,
            type: 'acceptTerms2',
            user: address,
        }),
    });
}
