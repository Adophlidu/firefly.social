/* cspell:disable */

import { IS_PREVIEW } from '@dimensiondev/constants';
import { compose } from '@dimensiondev/utils';
import { toArray } from 'lodash-es';
import { type NextRequest } from 'next/server.js';
import { z } from 'zod';

import { Locale } from '@/constants/enum.js';
import { CACHE_AGE_INDEFINITE_ON_DISK } from '@/constants/static.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { createRedPacketImage } from '@/services/createRedPacketImage.js';
import { TokenType, UsageType } from '@/types/rp.js';

const TokenSchema = z.object({
    type: z.nativeEnum(TokenType),
    symbol: z.string(),
    decimals: z.coerce.number().int().nonnegative(),
});

const CoverSchema = z.object({
    locale: z.nativeEnum(Locale),
    themeId: z.string().transform((x) => x || ''),
    usage: z.literal(UsageType.Cover),
    from: z.string().refine((x) => (x ? x.length < 50 : true), { message: 'From cannot be longer than 50 characters' }),
    message: z
        .string()
        .transform((x) => (x ? decodeURIComponent(x) : x))
        .refine((x) => (x ? toArray(x).length < 100 : true), {
            message: 'Message cannot be longer than 100 characters',
        }),
    amount: z.coerce
        .bigint()
        .nonnegative()
        .transform((x) => x.toString(10)),
    remainingAmount: z.coerce
        .bigint()
        .nonnegative()
        .transform((x) => x.toString(10)),
    shares: z.coerce
        .number()
        .positive()
        .refine((x) => x < 256, { message: 'Shares cannot be more than 256' }),
    remainingShares: z.coerce.number().nonnegative(),
    token: TokenSchema,
});

const PayloadSchema = z.object({
    locale: z.nativeEnum(Locale),
    themeId: z.string().transform((x) => x || ''),
    usage: z.literal(UsageType.Payload),
    from: z.string(),
    amount: z.coerce
        .bigint()
        .nonnegative()
        .transform((x) => x.toString(10)),
    token: TokenSchema,
    message: z.string(),
});

const ParamsSchema = z.object({
    usage: z.nativeEnum(UsageType).default(UsageType.Cover),
    locale: z.nativeEnum(Locale).default(Locale.en),
    'theme-id': z.string().optional(),
    from: z.string().default('unknown'),
    message: z.string().default('Hope this sparks a smile.'),
    amount: z.string().default('0'),
    'remaining-amount': z.string().optional(),
    shares: z.string().default('0'),
    'remaining-shares': z.string().optional(),
    type: z.nativeEnum(TokenType).default(TokenType.Fungible),
    symbol: z.string().default('?'),
    decimals: z.string().default('0'),
});

// Discriminated union schema for parsing based on usage
const RedPacketParamsSchema = ParamsSchema.transform((data) => {
    // Parse and validate token first
    const token = TokenSchema.parse({
        type: data.type,
        symbol: data.symbol,
        decimals: data.decimals,
    });

    // Handle remaining-amount fallback to amount
    const remainingAmount = data['remaining-amount'] ?? data.amount;
    // Handle remaining-shares fallback to shares
    const remainingShares = data['remaining-shares'] ?? data.shares ?? '0';

    if (data.usage === UsageType.Cover) {
        return CoverSchema.parse({
            usage: UsageType.Cover,
            locale: data.locale,
            themeId: data['theme-id'] ?? '',
            from: data.from,
            message: data.message,
            amount: data.amount,
            remainingAmount,
            shares: data.shares ?? '0',
            remainingShares,
            token,
        });
    } else {
        return PayloadSchema.parse({
            usage: UsageType.Payload,
            locale: data.locale,
            themeId: data['theme-id'] ?? '',
            from: data.from,
            amount: data.amount,
            token,
            message: data.message,
        });
    }
});

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    if (request.nextUrl.searchParams.size === 0) {
        return new Response('Invalid Params: No parameters provided', { status: 400 });
    }

    const params = getSearchParamsWithZodSchema(request, ParamsSchema);
    const redPacketParams = RedPacketParamsSchema.parse(params);

    const image = await createRedPacketImage(redPacketParams, request.signal);
    const headers = new Headers({
        'Content-Type': 'image/svg+xml',
        'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
    });

    if (IS_PREVIEW) {
        headers.set('Access-Control-Allow-Origin', '*');
    }

    return new Response(image, {
        headers,
    });
});
