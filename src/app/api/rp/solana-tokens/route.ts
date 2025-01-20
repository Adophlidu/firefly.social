import { StatusCodes } from 'http-status-codes';
import { uniqBy } from 'lodash-es';

import { env } from '@/constants/env.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import type { JupToken, SplToken } from '@/providers/types/Solana.js';

const TOKEN_JSON_URL =
    'https://raw.githubusercontent.com/solana-labs/token-list/refs/heads/main/src/tokens/solana.tokenlist.json';
const JUP_TOKEN_JSON_URL = 'https://tokens.jup.ag/tokens?tags=verified';

export async function GET() {
    try {
        const result = await Promise.all([
            env.external.NEXT_PUBLIC_SOLANA_DEV
                ? fetchJSON<{ tokens: SplToken[] }>(TOKEN_JSON_URL, {
                      cache: 'force-cache',
                  })
                : null,
            fetchJSON<JupToken[]>(JUP_TOKEN_JSON_URL, {
                cache: 'force-cache',
            }),
        ]);
        const [splResult, jupTokens] = result || [];

        return createSuccessResponseJSON(uniqBy([...(splResult?.tokens || []), ...(jupTokens || [])], 'address'));
    } catch (error) {
        return createErrorResponseJSON(getGatewayErrorMessage(error), {
            status: StatusCodes.BAD_GATEWAY,
        });
    }
}
