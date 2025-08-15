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

    return EventId.CONNECT_WALLET_SUCCESS;
}

export function captureConnectWalletSubmit(options: {
    origin: ClickOrigin | undefined;
    name: string | undefined;
    chain: string | undefined;
    connect_time: number | undefined;
}) {
    return runInSafeAsync(async () => {
        const wallet_type = options.chain === 'eip155' ? 'evm' : options.chain === 'solana' ? 'solana' : 'unknown';
        const event = {
            click_location: options.origin ?? ClickOrigin.Others,
            wallet_type,
            wallet_name: options.name ?? 'unknown',
            click_time: options.connect_time ?? 0,
        } as const;

        const eventId = resolveEventId(options.name ?? '');
        if (!eventId) return;

        TelemetryProvider.captureEvent(EventId.CONNECT_WALLET_SUBMIT, {
            ...event,
            wallet_type,
            wallet_app_name: options.name ?? 'unknown',
        });
    });
}
