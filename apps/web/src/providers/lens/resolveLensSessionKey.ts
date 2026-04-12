import type { EnvironmentConfig } from '@lens-protocol/client';

export function resolveLensSessionKey(environment: EnvironmentConfig) {
    return `lens.${environment.name}.credentials`;
}
