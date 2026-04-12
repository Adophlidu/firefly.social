import { envs } from '@dimensiondev/envs';
import { compose } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import type { NextRequest } from 'next/server.js';
import { mnemonicToAccount } from 'viem/accounts';
import { z } from 'zod';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getJsonBodyWithZodSchema } from '@/helpers/getJsonBodyWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { HexString } from '@/schemas/HexString.js';

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: 'Farcaster SignedKeyRequestValidator',
    version: '1',
    chainId: 10, // optimism
    verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553',
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
    { name: 'key', type: 'bytes' },
    { name: 'requestFid', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
] as const;

const BodySchema = z.object({
    key: HexString,
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { key } = await getJsonBodyWithZodSchema(request, BodySchema);

    const deadline = dayjs(Date.now()).add(1, 'y').unix();
    const account = mnemonicToAccount(envs.internal.FARCASTER_SIGNER_MNEMONIC);

    const signature = await account.signTypedData({
        domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        types: {
            SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
        },
        primaryType: 'SignedKeyRequest',
        message: {
            key,
            deadline: BigInt(deadline),
            requestFid: BigInt(envs.internal.FARCASTER_SIGNER_FID),
        },
    });

    return createSuccessResponseJson({
        body: {
            key,
            requestFid: Number.parseInt(envs.internal.FARCASTER_SIGNER_FID, 10),
            signature,
            deadline,
        },
        timestamp: Date.now(),
        expiresAt: deadline * 1000,
    });
});
