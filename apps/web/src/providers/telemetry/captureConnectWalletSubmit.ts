import { ClickOrigin } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

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

        TelemetryProvider.captureEvent(EventId.CONNECT_WALLET_SUBMIT, {
            ...event,
            wallet_type,
            wallet_app_name: options.name ?? 'unknown',
        });
    });
}
