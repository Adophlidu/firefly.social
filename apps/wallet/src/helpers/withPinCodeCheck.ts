import { Md5, runInSafeAsync, UserRejectionError } from '@dimensiondev/utils';

import { queryClient } from '@/configs/queryClient.js';
import { PinCodeWorkflow } from '@/constants/pinCode.js';
import { runPinCodeWorkflow } from '@/helpers/runPinCodeWorkflow.js';
import { getSecuritySettingsQuery } from '@/queries/firefly/getSecuritySettingsQuery.js';
import { skipPinCodeAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';
import { pinCodeAtom } from '@/store/pinCode.js';

export async function withPinCodeCheck<T>(callback: (pinCode?: string) => Promise<T>): Promise<T> {
    if (store.get(skipPinCodeAtom)) return callback();

    const pinConfig = await runInSafeAsync(() =>
        queryClient.ensureQueryData({
            ...getSecuritySettingsQuery(),
            queryFn: async () => {
                store.set(pinCodeAtom, null); // Clear cached pin code on each check

                return getFireflyEndpoint().getPinCodeStatus();
            },
            staleTime: 1000 * 60 * 10, // 10 minutes
        }),
    );
    if (!pinConfig?.enable) return callback();

    const cachedCode = store.get(pinCodeAtom);
    const pinCode = pinConfig.is_set_pin_code
        ? cachedCode || (await runPinCodeWorkflow(PinCodeWorkflow.Authenticate))
        : await runPinCodeWorkflow(PinCodeWorkflow.Create);
    if (!pinCode) throw new UserRejectionError('Pin code entry was cancelled');

    return callback(pinCode ? Md5.hashStr(pinCode) : undefined);
}
