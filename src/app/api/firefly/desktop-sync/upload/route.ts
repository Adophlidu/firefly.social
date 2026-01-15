import { compose, parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import urlcat from 'urlcat';
import { z } from 'zod';

import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { decrypt, encrypt } from '@/helpers/encodec.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getHeadersWithZodSchema } from '@/helpers/getHeadersWithZodSchema.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getTwitterAccountsServerSide } from '@/providers/twitter/getTwitterAccountsServerSide.js';
import type { DesktopLinkInfoStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';
import type { AuthDataToUpload, DesktopSyncPayload } from '@/types/sync.js';

const HeadersSchema = z.object({
    authorization: z.string().min(1, 'Unauthorized'),
});

const BodySchema = z.object({
    session: z.string(),
    cryptoKey: z.string(),
    encryptedPayload: z.string(), // Encrypted account data from client
});

export const POST = compose(withRequestErrorHandler({ throwError: true }), async (request: NextRequest) => {
    const { authorization: token } = getHeadersWithZodSchema(request, HeadersSchema);

    const body = await getJsonBodyWithZodSchema(request, BodySchema);
    const { session, cryptoKey, encryptedPayload } = body;

    // 1. Parallel: Decrypt the account data payload from client AND confirm sync channel
    const confirmUrl = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/sync/confirm');

    const [decryptedPayload, confirmResponse] = await Promise.all([
        decrypt(encryptedPayload, cryptoKey),
        fetchJson<DesktopLinkInfoStatusResponse>(confirmUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ session, op: 'confirm' }),
        }),
    ]);

    const accountData = parseJson<DesktopSyncPayload>(decryptedPayload);
    if (!accountData) return createErrorResponseJson('Failed to decrypt account data', { status: 400 });
    if (!confirmResponse.data) return createErrorResponseJson('Failed to confirm sync channel', { status: 400 });

    const {
        twitterAccounts = [],
        farcasterAccounts = [],
        lensAccounts = [],
        bskyAccounts = [],
        fireflyAccountData,
    } = accountData;

    // 2. Get Twitter accounts with consumer secrets from server-side storage
    const twitterAccountsWithSecrets = await getTwitterAccountsServerSide(twitterAccounts);

    // 3. Build complete social accounts array
    const socialAccounts = [...farcasterAccounts, ...lensAccounts, ...twitterAccountsWithSecrets, ...bskyAccounts];

    // 4. Encrypt the payload server-side
    const jsonString = JSON.stringify({
        ...fireflyAccountData,
        social_accounts: socialAccounts,
    } satisfies AuthDataToUpload);
    const encryptedData = await encrypt(jsonString, cryptoKey);

    // 5. Upload to Firefly
    const uploadUrl = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/sync/uploadData');
    const uploadResponse = await fetchJson<DesktopLinkInfoStatusResponse>(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: token,
        },
        body: JSON.stringify({ session, encryptedData }),
    });

    if (!uploadResponse.data) {
        return createErrorResponseJson('Failed to upload sync data', { status: 500 });
    }

    return createSuccessResponseJson({ uploaded: true });
});
