import { delay } from '@firefly/utils';
import urlcat from 'urlcat';

import { AbortError } from '@/constants/error.js';
import { WARPCAST_ROOT_URL_V2 } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { SignedKeyRequestResponse } from '@/providers/types/Warpcast.js';

/**
 * Waits for a signed key request to reach a specified state.
 * @param signal - An optional AbortSignal to allow aborting the operation.
 * @returns An asynchronous function that waits for the signed key request to complete.
 */
export function waitForSignedKeyRequest(signal?: AbortSignal) {
    return async (token: string, maxTries = Number.MAX_SAFE_INTEGER, ms = 3000) => {
        let tries = 0;

        while (true) {
            // Check if the operation has been aborted
            if (signal?.aborted) throw new AbortError();

            tries += 1;

            // Check if the maximum number of tries has been reached
            if (tries >= maxTries)
                throw new Error('Failed to fetch the latest state after several attempts. Please try again later.');

            // Delay for a specified duration before checking again
            await delay(ms);

            // Fetch the signed key request status from the server
            const response = await fetchJson<SignedKeyRequestResponse>(
                urlcat(WARPCAST_ROOT_URL_V2, '/signed-key-request', {
                    token,
                }),
                {
                    signal,
                },
            );

            console.log(`[waitForSignedKeyRequest] ${token}`, response);

            // Continue the loop if there are errors in the response
            if (response.errors?.length) continue;

            // Check if the signed key request has reached the 'completed' state
            if (response.result.signedKeyRequest.state === 'completed') return response;
        }
    };
}
