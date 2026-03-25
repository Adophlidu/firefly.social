import { envs } from '@dimensiondev/envs';
import { compose } from '@dimensiondev/utils';
import { type NextRequest } from 'next/server.js';
import z from 'zod';

import { SourceInURL } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { uploadMetrics } from '@/providers/firefly/metrics/uploadMetrics.js';
import { createTwitterSessionPayloadFromHeaders } from '@/providers/twitter/createTwitterSessionPayload.js';
import { type TwitterMetricsData } from '@/providers/types/Firefly.js';
import { encryptAes256 } from '@/services/crypto.js';

const BodySchema = z.object({
    encryptKey: z.string().min(1),
    encryptedPasscode: z.string().min(1),
    metaInfo: z.object({
        platform: z.literal(SourceInURL.Twitter),
        profileId: z.string().min(1),
        profileHandle: z.string(),
        name: z.string(),
        avatar: z.string(),
        loginTime: z.string(),
    }),
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { encryptKey, metaInfo, encryptedPasscode } = await getJsonBodyWithZodSchema(request, BodySchema);
    const authorization = request.headers.get('Authorization');
    if (!authorization) return createErrorResponseJson('Authorization header missing', { status: 401 });

    const sessionPayload = await createTwitterSessionPayloadFromHeaders();
    if (!sessionPayload) return createErrorResponseJson('Twitter session not found', { status: 401 });

    const twitterMetricsData: TwitterMetricsData = {
        platform: SourceInURL.Twitter,
        profile_id: metaInfo.profileId,
        login_time: Date.now().toString(),
        client_id: sessionPayload.clientId,
        access_token: sessionPayload.accessToken,
        access_token_secret: sessionPayload.accessTokenSecret,
        consumer_key: sessionPayload.consumerKey,
        consumer_secret: sessionPayload.consumerSecret,
    };
    const encryptData = encryptAes256(
        JSON.stringify(twitterMetricsData),
        encryptKey,
        envs.external.NEXT_PUBLIC_PASSCODE_IV,
    );
    const result = await uploadMetrics(
        encryptedPasscode,
        [
            {
                metaInfo,
                ciphertext: encryptData,
            },
        ],
        {
            isEncrypted: true,
            headers: {
                Authorization: authorization,
            },
        },
    );

    return createSuccessResponseJson(result);
});
