import { runInSafeAsync } from '@dimensiondev/utils';

import { ClickOrigin } from '@/constants/enum.js';
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

    return EventId.CONNECT_WALLET_SUCCESS;
}

export function captureConnectWalletEvent(
    eventId: EventId.CONNECT_WALLET_SUCCESS,
    options: {
        origin: ClickOrigin | undefined;
        name: string | undefined;
        address: string | undefined;
        connect_time: number | undefined;
        connect_success_time?: number;
    },
) {
    return runInSafeAsync(async () => {
        const evmAddress = options.address?.startsWith('eip155') ? options.address.split(':')[2] : undefined;
        const solanaAddress = options.address?.startsWith('solana') ? options.address.split(':').pop() : undefined;
        const wallet_address = evmAddress?.toLowerCase() || solanaAddress || '0x0';
        const wallet_type = evmAddress ? 'evm' : solanaAddress ? 'solana' : 'unknown';
        const event = {
            click_location: options.origin ?? ClickOrigin.Others,
            wallet_address,
            wallet_type,
            wallet_name: options.name ?? 'unknown',
            click_time: options.connect_time ?? 0,
            connect_success_time: options.connect_success_time ?? 0,
            connect_duration:
                options.connect_time && options.connect_success_time
                    ? options.connect_success_time - options.connect_time
                    : 0,
        } as const;

        TelemetryProvider.captureEvent(EventId.CONNECT_WALLET_SUCCESS, event);

        const eventId = resolveEventId(options.name ?? '');
        if (!eventId) return;

        TelemetryProvider.captureEvent(eventId, {
            ...event,
            wallet_type,
            wallet_address,
            wallet_app_name:
                eventId === EventId.CONNECT_WALLET_SUCCESS_WALLET_CONNECT ? (options.name ?? 'unknown') : undefined,
        });
    });
}
