import type { ConnectionPlatform } from '@dimensiondev/enums';
import { NetworkType, WatchType } from '@dimensiondev/enums';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';
import type { Address } from 'viem';

import { SetQueryDataForBlockWallet } from '@/decorators/SetQueryDataForBlockWallet.js';
import { SetQueryDataForReportAndDeleteWallet } from '@/decorators/SetQueryDataForReportAndDeleteWallet.js';
import { SetQueryDataForWatchWallet } from '@/decorators/SetQueryDataForWatchWallet.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { block } from '@/providers/firefly/endpoint/block.js';
import { unblock } from '@/providers/firefly/endpoint/unblock.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    BindWalletResponse,
    BindWalletV3Response,
    DetectAddressResponse,
    EmptyResponse,
    FireflyWalletConnection,
    HexResponse,
    Response,
    WalletRelation,
    WalletRelationResponse,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

@SetQueryDataForBlockWallet()
@SetQueryDataForReportAndDeleteWallet()
@SetQueryDataForWatchWallet()
class FireflyWallet {
    /** Bind an EVM wallet via `/v3/user/bindWallet` (synchronous write, so no post-bind poll). `isForce` is omitted so an already-linked wallet still throws (code 231). */
    async verifyAndBindWallet(
        address: string,
        message: string,
        signature: string,
    ): Promise<BindWalletResponse['data']> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/bindWallet');
        const response = await fireflySessionHolder.fetchWithSession<BindWalletV3Response>(url, {
            method: 'POST',
            body: JSON.stringify({ address, signedMessage: message, signature }),
        });
        resolveFireflyResponseData(response); // throws on { error }

        return {
            id: '',
            address: address as Address,
            ens: '',
            is_connected: true,
            blockchain: NetworkType.Ethereum,
            signMessage: message,
            signature,
        };
    }

    async getMessageToSignMessageForBindSolanaWallet(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/solana/signMessage', {
            address,
        });

        const response = await fireflySessionHolder.fetch<HexResponse>(url);

        const data = resolveFireflyResponseData(response);
        if (!data) throw new Error('Failed to get message to sign');

        return data;
    }

    async verifyAndBindSolanaWallet(address: string, messageToSign: string, signature: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/solana/verify');
        const response = await fireflySessionHolder.fetch<BindWalletResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                address,
                messageToSign,
                signature,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async watchWallet(address: string) {
        if (!isValidAddressEthereum(address) && !isValidAddressSolana(address))
            throw new Error(`Invalid address: ${address}`);
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/follow', {
            type: isValidAddressSolana(address) ? WatchType.SolanaWallet : WatchType.Wallet,
            toObjectId: address,
        });
        await fireflySessionHolder.fetch<Response<void>>(url, { method: 'PUT' });
        return true;
    }

    async unwatchWallet(address: string) {
        if (!isValidAddressEthereum(address) && !isValidAddressSolana(address))
            throw new Error(`Invalid address: ${address}`);
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/follow', {
            type: isValidAddressSolana(address) ? WatchType.SolanaWallet : WatchType.Wallet,
            toObjectId: address,
        });
        await fireflySessionHolder.fetch<Response<void>>(url, { method: 'DELETE' });
        return true;
    }

    async reportAndDeleteWallet(connection: FireflyWalletConnection, reason: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/wallet/report');

        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                web3Id: connection.twitterId,
                walletAddress: connection.address,
                reportReason: reason,
                sources: connection.sources?.map((x) => x.source).join(',') || '[]',
            }),
        });
    }

    async blockWallet(address: string) {
        return block('address', address);
    }

    async unblockWallet(address: string) {
        return unblock('address', address);
    }

    async detectAddress(address: string, chainId?: string) {
        if (!address) return null;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/detect', {
            address,
            chainId,
        });
        const response = await fireflySessionHolder.fetch<DetectAddressResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async updateDefaultConnection(platformId: string | number, platform: ConnectionPlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, `/v2/wallet/updateDefaultConnection`);
        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                platform,
                profile_id: `${platformId}`,
            }),
        });
    }

    async getWalletRelation(walletAddress: string) {
        const walletType = isValidAddressSolana(walletAddress) ? 'solana' : 'evm';
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/relation', {
            walletAddress,
            walletType,
        });
        const response = await fetchJson<WalletRelationResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getWalletRelationList(
        walletAddresses: Array<{
            walletAddress: string;
            walletType: 'solana' | 'evm';
        }>,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/walletRelation/list');
        const response = await fetchJson<Response<WalletRelation[]>>(url, {
            method: 'POST',
            body: JSON.stringify({
                items: walletAddresses,
            }),
        });

        return resolveFireflyResponseData(response);
    }
}

export { FireflyWallet };
export const fireflyWalletProvider = new FireflyWallet();
