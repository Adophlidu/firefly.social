import { ClickOrigin } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

function resolveEventId(name_: string) {
    const name = name_.toLowerCase();

    if (name.includes('metamask')) return EventId.CONNECT_WALLET_SUCCESS_METAMASK;
    if (name.includes('rabby')) return EventId.CONNECT_WALLET_SUCCESS_RABBY;
    if (name.includes('wallet connect') || name.includes('walletconnect'))
        return EventId.CONNECT_WALLET_SUCCESS_WALLET_CONNECT;
    if (name.includes('binance')) return EventId.CONNECT_WALLET_SUCCESS_BINANCE;
    if (name.includes('okx')) return EventId.CONNECT_WALLET_SUCCESS_OKX;
    if (name.includes('zerion')) return EventId.CONNECT_WALLET_SUCCESS_ZERION;
    if (name.includes('rainbow')) return EventId.CONNECT_WALLET_SUCCESS_RAINBOW;
    if (name.includes('coinbase')) return EventId.CONNECT_WALLET_SUCCESS_COINBASE;
    if (name.includes('phantom')) return EventId.CONNECT_WALLET_SUCCESS_PHANTOM;
    if (name.includes('firefly')) return EventId.CONNECT_WALLET_SUCCESS_PARTICLE;

    return EventId.CONNECT_WALLET_SUCCESS;
}

export function captureConnectWalletEvent(
    eventId: EventId.CONNECT_WALLET_SUCCESS,
    options?: {
        origin?: ClickOrigin;
        name?: string;
        address?: string;
        connect_time?: number;
        connect_success_time?: number;
    },
) {
    return runInSafeAsync(async () => {
        const evmAddress = options?.address?.startsWith('eip155') ? options?.address.split(':')[2] : undefined;
        const solanaAddress = options?.address?.startsWith('solana') ? options?.address.split(':')[1] : undefined;
        const event = {
            click_location: options?.origin ?? ClickOrigin.Others,
            wallet_address: evmAddress || solanaAddress || '0x0',
            wallet_type: evmAddress ? 'evm' : solanaAddress ? 'solana' : 'unknown',
            wallet_name: options?.name ?? 'unknown',
            click_time: options?.connect_time ?? 0,
            connect_success_time: options?.connect_success_time ?? 0,
            connect_duration:
                options?.connect_time && options?.connect_success_time
                    ? options.connect_success_time - options.connect_time
                    : 0,
        } as const;

        TelemetryProvider.captureEvent(EventId.CONNECT_WALLET_SUCCESS, event);
        TelemetryProvider.captureEvent(resolveEventId(options?.name ?? ''), event);
    });
}
