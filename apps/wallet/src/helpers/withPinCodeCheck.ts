import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/wallet';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { Md5, runInSafeAsync, UserRejectionError } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';

import { queryClient } from '@/configs/queryClient.js';
import { FIREFLY_API_ERROR_CODES, FireflyApiError } from '@/constants/error.js';
import { PinCodeWorkflow } from '@/constants/pinCode.js';
import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';
import { runPinCodeWorkflow } from '@/helpers/runPinCodeWorkflow.js';
import { getSecuritySettingsQuery } from '@/queries/firefly/getSecuritySettingsQuery.js';
import { skipPinCodeAtom } from '@/store/embeddedWallets.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';
import { store } from '@/store/index.js';
import { pinCodeAtom } from '@/store/pinCode.js';

async function ensurePinCode(forceRequired = false) {
    // Frontend kill switch: when disabled, never require a PIN code.
    if (envs.external.NEXT_PUBLIC_PIN_CODE !== STATUS.Enabled) return;

    const pinConfig = await runInSafeAsync(() =>
        queryClient.fetchQuery({
            ...getSecuritySettingsQuery(),
            queryFn: async () => {
                store.set(pinCodeAtom, null); // Clear cached pin code on each check

                return getFireflyEndpoint().getPinCodeStatus();
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        }),
    );
    if (!pinConfig?.enable && forceRequired) {
        throw new Error(t`A pin code is required to perform this action. Please enable it in your security settings.`);
    }
    if (!pinConfig?.enable) return;

    if (isRunningInIframe()) {
        await iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_OPEN, {});
    }

    const pinCode = pinConfig?.is_set_pin_code
        ? await runPinCodeWorkflow(PinCodeWorkflow.Authenticate)
        : await runPinCodeWorkflow(PinCodeWorkflow.Create);
    if (!pinCode) throw new UserRejectionError('Pin code entry was cancelled');

    return pinCode;
}

export async function withPinCodeCheck<T>(callback: (pinCode?: string) => Promise<T>): Promise<T> {
    const pinCode = store.get(skipPinCodeAtom) ? undefined : await ensurePinCode();

    try {
        return await callback(pinCode ? Md5.hashStr(pinCode) : undefined);
    } catch (err) {
        if (
            err instanceof FireflyApiError &&
            (err.code === FIREFLY_API_ERROR_CODES.PinCodeRequired || err.message.includes('Privy code is required'))
        ) {
            await queryClient.invalidateQueries({
                queryKey: getSecuritySettingsQuery().queryKey,
            });
            const newPinCode = await ensurePinCode(true);
            if (!newPinCode) throw new UserRejectionError('Pin code entry was cancelled');

            return callback(Md5.hashStr(newPinCode));
        }

        throw err;
    }
}
