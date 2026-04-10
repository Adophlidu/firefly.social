import { envs, STATUS } from '@dimensiondev/envs';
import { NotImplementedError, runInSafeAsync } from '@dimensiondev/utils';
import { sendGAEvent } from '@next/third-parties/google';
import { isHex } from 'viem';

import { logger } from '@/libs/Logger.js';
import { getPublicParameters } from '@/providers/telemetry/getPublicParameters.js';
import { type Events, Provider, ProviderFilter, VersionFilter } from '@/providers/types/Telemetry.js';

function formatParameter(key: string, value: unknown): [string, unknown] {
    if (typeof value === 'boolean') {
        return [key, value === true ? 'Y' : 'N'];
    } else if (isHex(value)) {
        return [key, `hex:${value.toString()}`];
    } else {
        return [key, value];
    }
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

        if (envs.external.NEXT_PUBLIC_TELEMETRY === STATUS.Disabled) {
            logger.info('[telemetry] event capture is disabled');
            return;
        }

        if (version_filter === VersionFilter.Next) {
            logger.error('[telemetry] event is filtered out:', name, parameters);
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
                logger.info('[ga] capture event:', event.eventType, event.parameters);
                sendGAEvent('event', event.eventType, event.parameters);
            } catch (error) {
                logger.error('[ga] failed to capture event:', event);
            }
        } else {
            logger.info('[ga] event is filtered out:', name, parameters);
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
