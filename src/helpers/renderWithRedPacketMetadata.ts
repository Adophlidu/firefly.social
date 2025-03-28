import type { TypedMessage } from '@masknet/typed-message';
import { createRenderWithMetadata, createTypedMessageMetadataReader } from '@masknet/typed-message-react';
import { EthereumChainId } from '@masknet/web3-shared-evm';
import { Err, Ok, type Result } from 'ts-results-es';

import { SOLANA_PREFIX, SolanaRedPacketMetaKey, SupportedMetaKeys } from '@/constants/rp.js';
import { EVMChainResolver } from '@/mask/index.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import Schema from '@/schemas/rp.json' with { type: 'json' };

type ReaderCacheMap = Record<string, (meta: TypedMessage['meta']) => Result<RedPacketJSONPayload, void>>;
const readerCache = SupportedMetaKeys.reduce<ReaderCacheMap>((acc, key) => {
    acc[key] = createTypedMessageMetadataReader<RedPacketJSONPayload>(key, Schema);
    return acc;
}, {});

export function RedPacketMetadataReader(
    metadata: ReadonlyMap<string, unknown> | undefined,
): Result<RedPacketJSONPayload, void> {
    const metaKey = SupportedMetaKeys.find((key) => !!metadata?.get(key));
    const reader = readerCache[metaKey ?? ''];
    if (!reader) return Err.EMPTY;

    const result = reader(metadata);
    if (result.isOk()) {
        const payload = result.value;
        // Hard code for legacy RedPacket
        if (!payload.token && payload.contract_version === 1 && payload.token_type === 0) {
            const chainId = payload.network === 'Mainnet' ? EthereumChainId.Mainnet : undefined;
            if (!chainId) return result;

            return Ok({
                ...payload,
                token: EVMChainResolver.nativeCurrency(chainId),
            });
        }

        const rpid =
            metaKey === SolanaRedPacketMetaKey && !payload.rpid.startsWith(SOLANA_PREFIX)
                ? `${SOLANA_PREFIX}${payload.rpid}`
                : payload.rpid;
        return Ok({
            ...payload,
            rpid,
        });
    }
    return result;
}
export const renderWithRedPacketMetadata = createRenderWithMetadata(RedPacketMetadataReader);
