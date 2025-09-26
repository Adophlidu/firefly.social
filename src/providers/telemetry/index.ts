import { sendGAEvent } from '@next/third-parties/google';
import { isHex } from 'viem';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { AbortError, InvalidResultError, NotImplementedError } from '@/constants/error.js';
import { bom } from '@/helpers/bom.js';
import { retry } from '@/helpers/retry.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getPublicParameters } from '@/providers/telemetry/getPublicParameters.js';
import { type Events, EventType, Provider, ProviderFilter, VersionFilter } from '@/providers/types/Telemetry.js';

function formatParameter(key: string, value: unknown): [string, unknown] {
    if (typeof value === 'boolean') {
        return [key, value === true ? 'Y' : 'N'];
    } else if (isHex(value)) {
        return [key, `hex:${value.toString()}`];
    } else {
        return [key, value];
    }
}

async function getSafary(signal?: AbortSignal) {
    return retry(
        async () => {
            if (typeof bom.window === 'undefined') throw new AbortError();
            if (typeof bom.window?.safary === 'undefined') throw new InvalidResultError();
            return bom.window.safary;
        },
        {
            times: 5,
            interval: 300,
            signal,
        },
    );
}

type CaptureParameters<T extends keyof Events> = [
    T,
    Omit<Events[T]['parameters'], keyof ReturnType<typeof getPublicParameters>> & {
        firefly_account_id?: string;
    },
    { version_filter?: VersionFilter; provider_filter?: ProviderFilter }?,
];

class Telemetry extends Provider<Events, never> {
    private latestEventId: string | null = null;

    override async captureEvent<T extends keyof Events>(...rest: CaptureParameters<T>): Promise<void> {
        const [name, parameters, { version_filter = VersionFilter.Latest, provider_filter = ProviderFilter.All } = {}] =
            rest;

        if (env.external.NEXT_PUBLIC_TELEMETRY === STATUS.Disabled) {
            console.log('[telemetry] event capture is disabled');
            return;
        }

        if (version_filter === VersionFilter.Next) {
            console.error('[telemetry] event is filtered out:', name, parameters);
            return;
        }

        // update the latest event id
        const publicParameters = getPublicParameters(crypto.randomUUID(), this.latestEventId);
        this.latestEventId = publicParameters.public_uuid;

        const formattedParameters = Object.fromEntries(
            Object.entries({
                ...publicParameters,
                ...parameters,
            }).map(([key, value]) => formatParameter(key, value)),
        );

        const event = {
            eventType: name,
            eventName: name.replaceAll(/_/g, ' '),
            parameters: formattedParameters as unknown as Events[T]['parameters'],
        };

        if (provider_filter === ProviderFilter.All || provider_filter === ProviderFilter.GA) {
            try {
                console.info('[ga] capture event:', event.eventType, event.parameters);
                sendGAEvent('event', event.eventType, event.parameters);
            } catch (error) {
                console.error('[ga] failed to capture event:', event);
            }
        } else {
            console.info('[ga] event is filtered out:', name, parameters);
        }

        if (provider_filter === ProviderFilter.All || provider_filter === ProviderFilter.Safary) {
            try {
                const safary = await getSafary();

                if (safary) {
                    await safary.track(event);
                } else {
                    console.error('[safary] safary SDK not available. failed to capture event:', name, parameters);
                }
            } catch (error) {
                console.error('[safary] failed to capture event:', event);
            }
        } else {
            console.info('[safary] event is filtered out:', name, parameters);
        }
    }

    async captureEventInSafe<T extends keyof Events>(...rest: CaptureParameters<T>) {
        return runInSafeAsync(() => this.captureEvent(...rest));
    }

    override async captureException(): Promise<void> {
        throw new NotImplementedError();
    }
}

export const TelemetryProvider = new Telemetry();
