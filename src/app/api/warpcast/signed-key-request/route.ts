import dayjs from 'dayjs';
import { NextRequest } from 'next/server.js';
import type { Hex } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { z } from 'zod';

import { env } from '@/constants/env.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { HexStringSchema } from '@/schemas/index.js';

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
    key: HexStringSchema,
});

export async function POST(request: NextRequest) {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) return createErrorResponseJson(parsed.error.message, { status: 400 });

    const key = parsed.data.key as Hex;

    const deadline = dayjs(Date.now()).add(1, 'y').unix();
    const account = mnemonicToAccount(env.internal.FARCASTER_SIGNER_MNEMONIC);

    const signature = await account.signTypedData({
        domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        types: {
            SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
        },
        primaryType: 'SignedKeyRequest',
        message: {
            key,
            deadline: BigInt(deadline),
            requestFid: BigInt(env.internal.FARCASTER_SIGNER_FID),
        },
    });

    return createSuccessResponseJson({
        body: {
            key,
            requestFid: Number.parseInt(env.internal.FARCASTER_SIGNER_FID, 10),
            signature,
            deadline,
        },
        timestamp: Date.now(),
        expiresAt: deadline * 1000,
    });
}
