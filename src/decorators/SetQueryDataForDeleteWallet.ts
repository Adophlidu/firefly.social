import { produce } from 'immer';

import { queryClient } from '@/configs/queryClient.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import type { FireflyWallet } from '@/providers/firefly/Wallet.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';
import type { ClassType } from '@/types/utility.js';

const METHODS_BE_OVERRIDDEN = ['disconnectWallet'] as const;
const METHODS_BE_OVERRIDDEN_FOR_REPORT = ['reportAndDeleteWallet'] as const;

function deleteWalletsFromQueryData(address: string) {
    queryClient.setQueriesData<
        Record<'connected' | 'related' | 'solanaConnections' | 'evmConnections', FireflyWalletConnection[]>
    >(
        {
            queryKey: ['allConnections'],
        },
        (old) => {
            if (!old) return old;
            return produce(old, (draft) => {
                draft.connected = draft.connected?.filter((x) => !isSameAddress(x.address, address));
                draft.related = draft.related?.filter((x) => !isSameAddress(x.address, address));
                draft.evmConnections = draft.evmConnections?.filter((x) => !isSameAddress(x.address, address));
                draft.solanaConnections = draft.solanaConnections?.filter((x) => !isSameAddress(x.address, address));
            });
        },
    );
}

export function SetQueryDataForDeleteWallet() {
    return function decorator<T extends ClassType<FireflyWallet>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN)[number]>(key: K) {
            const method = target.prototype[key] as FireflyWallet[K];

            Object.defineProperty(target.prototype, key, {
                value: async (...args: Parameters<FireflyWallet[K]>) => {
                    const m = method as unknown as (
                        ...args: Parameters<FireflyWallet[K]>
                    ) => ReturnType<FireflyWallet[K]>;
                    const result = await m.call(target.prototype, ...args);
                    deleteWalletsFromQueryData(args[0]);
                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN.forEach(overrideMethod);

        return target;
    };
}

export function SetQueryDataForReportAndDeleteWallet() {
    return function decorator<T extends ClassType<FireflyWallet>>(target: T): T {
        function overrideMethod<K extends (typeof METHODS_BE_OVERRIDDEN_FOR_REPORT)[number]>(key: K) {
            const method = target.prototype[key] as FireflyWallet[K];

            Object.defineProperty(target.prototype, key, {
                value: async (connection: FireflyWalletConnection, reason: string) => {
                    const m = method as (
                        options: Parameters<FireflyWallet['reportAndDeleteWallet']>[0],
                        reason: string,
                    ) => ReturnType<FireflyWallet[K]>;
                    const result = await m.call(target.prototype, connection, reason);
                    deleteWalletsFromQueryData(connection.address);
                    return result;
                },
            });
        }

        METHODS_BE_OVERRIDDEN_FOR_REPORT.forEach(overrideMethod);

        return target;
    };
}
