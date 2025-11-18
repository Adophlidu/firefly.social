import urlcat from 'urlcat';

import type { ConnectionPlatform } from '@/constants/enum.js';
import { SetQueryDataForAddWallet } from '@/decorators/SetQueryDataForAddWallet.js';
import { SetQueryDataForBlockWallet } from '@/decorators/SetQueryDataForBlockWallet.js';
import { SetQueryDataForReportAndDeleteWallet } from '@/decorators/SetQueryDataForReportAndDeleteWallet.js';
import { SetQueryDataForWatchWallet } from '@/decorators/SetQueryDataForWatchWallet.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { block } from '@/providers/firefly/endpoint/block.js';
import { unblock } from '@/providers/firefly/endpoint/unblock.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    BindWalletResponse,
    DetectAddressResponse,
    EmptyResponse,
    FireflyWalletConnection,
    HexResponse,
    Response,
    WalletRelationResponse,
} from '@/providers/types/Firefly.js';
import { WatchType } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

@SetQueryDataForBlockWallet()
@SetQueryDataForAddWallet()
@SetQueryDataForReportAndDeleteWallet()
@SetQueryDataForWatchWallet()
class FireflyWallet {
    async verifyAndBindWallet(signMessage: string, signature: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet/verify');
        const response = await fireflySessionHolder.fetch<BindWalletResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                signMessage,
                signature,
            }),
        });

        const data = resolveFireflyResponseData(response);
        return data;
    }

    async getMessageToSignMessageForBindSolanaWallet(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/solana/signMessage', {
            address,
        });

        const response = await fireflySessionHolder.fetch<HexResponse>(url, {
            method: 'GET',
        });

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
        const response = await fireflySessionHolder.fetch<DetectAddressResponse>(url, { method: 'GET' });

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
}

export { FireflyWallet };
export const fireflyWalletProvider = new FireflyWallet();
