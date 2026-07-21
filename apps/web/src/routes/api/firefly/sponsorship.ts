import { envs } from '@dimensiondev/envs/web';
import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { generateSHA256JWT } from '@/helpers/generateSHA256JWT.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { generateFarcasterSignatures } from '@/providers/firefly/auth/generateFarcasterSignatures.js';
import { HexString } from '@/schemas/HexString.js';

const BodySchema = z.object({
    key: HexString,
});

const postHandler = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { key } = await getJsonBodyWithZodSchema(request, BodySchema);

    const jwt = await generateSHA256JWT(
        {
            client_from: 'web',
        },
        envs.internal.FIREFLY_JWT_SECRET,
    );

    const deadline = dayjs(Date.now()).add(1, 'y').unix();
    const { sponsorSignature, signedKeyRequestSignature, requestFid } = await generateFarcasterSignatures(
        key,
        deadline,
        jwt,
        request.signal,
    );

    return createSuccessResponseJson({
        body: {
            key,
            signature: signedKeyRequestSignature,
            deadline,
            requestFid,
            sponsorship: {
                sponsorFid: requestFid,
                signature: sponsorSignature,
            },
        },
        expiresAt: deadline * 1000,
        timestamp: Date.now(),
    });
});

export function POST({ request }: ApiContext) {
    return postHandler(request as NextRequest);
}
