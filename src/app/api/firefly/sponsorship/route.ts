import { compose } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { env } from '@/constants/env.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { JWTGenerator } from '@/libs/JWTGenerator.js';
import { generateFarcasterSignatures } from '@/providers/firefly/auth/generateFarcasterSignatures.js';
import { HexString } from '@/schemas/index.js';

const BodySchema = z.object({
    key: HexString,
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { key } = await getJsonBodyWithZodSchema(request, BodySchema);

    const generator = new JWTGenerator();
    const jwt = await generator.generateSHA256JWT(
        {
            client_from: 'web',
        },
        env.internal.FIREFLY_JWT_SECRET,
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
