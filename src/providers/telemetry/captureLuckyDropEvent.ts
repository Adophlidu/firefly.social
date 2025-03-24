import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { EventId } from '@/providers/types/Telemetry.js';
import type { RedPacketMetadata } from '@/types/rp.js';
import { safeUnreachable } from '@masknet/kit';

function getLuckyDropParametersFromMetadata(metadata: RedPacketMetadata) {
    return {
        lucky_drop_id: metadata.rpid,
        amount: metadata.total,
        currency: metadata.token.symbol,
        winners: metadata.shares,
        chain_id: metadata.token.chainId.toString(),
        chain_name: metadata.network,
        distribution_rule: metadata.is_random ? 'random' : 'equal',
    } as const;
}

function getLuckyDropParametersFromPayload(payload: RedPacketJSONPayload) {
    return {
        lucky_drop_id: payload.rpid,
        amount: payload.total,
        currency: payload.token?.symbol ?? 'native',
        winners: payload.shares,
        chain_id: payload.token?.chainId.toString() ?? '1',
        chain_name: payload.network ?? 'unknown',
        distribution_rule: payload.is_random ? 'random' : 'equal',
    } as const;
}

export function captureLuckyDropEvent(
    action: 'create' | 'claim' | 'refund',
    options?: {
        payload?: RedPacketJSONPayload;
        metadata?: RedPacketMetadata;
        claimer?: string;
        free?: boolean;
    },
) {
    return runInSafeAsync(async () => {
        switch (action) {
            case 'create':
                if (!options?.metadata) throw new Error('metadata is required');
                await TelemetryProvider.captureEvent(EventId.LUCKY_DROP_CREATE_SUCCESS, {
                    ...getLuckyDropParametersFromMetadata(options.metadata),
                    ...getWalletEventParameters(options.metadata.sender.address),
                    free_gas: false,
                });
                return;
            case 'claim':
                if (!options?.payload || !options.claimer) throw new Error('payload and claimer is required');
                await TelemetryProvider.captureEvent(EventId.LUCKY_DROP_CLAIM_SUCCESS, {
                    ...getLuckyDropParametersFromPayload(options.payload),
                    ...getWalletEventParameters(options.claimer),
                    free_gas: options.free ?? false,
                });
                return;
            case 'refund':
                if (!options?.claimer) throw new Error('claimer is required');
                await TelemetryProvider.captureEvent(EventId.LUCKY_DROP_REFUND_SUCCESS, {
                    ...getWalletEventParameters(options.claimer),
                });
                return;
            default:
                safeUnreachable(action);
                return;
        }
    });
}
