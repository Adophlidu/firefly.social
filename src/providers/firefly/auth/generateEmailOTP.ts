import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { OTPExceededMaximumLimit } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { GenerateOTPResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function generateEmailOTP(email: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/email/generateOTP');
    const response = await fetchJson<GenerateOTPResponse>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({
                email,
            }),
        },
        {
            noStrictOK: true,
        },
    );

    if (response.code === 1642) throw new OTPExceededMaximumLimit(first(response.error));

    return resolveFireflyResponseData(response);
}
