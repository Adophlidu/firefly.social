import { uniqBy } from 'lodash-es';

import { env } from '@/constants/env.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import type { JupToken, SplToken } from '@/providers/types/Solana.js';

const TOKEN_JSON_URL =
    'https://raw.githubusercontent.com/solana-labs/token-list/refs/heads/main/src/tokens/solana.tokenlist.json';
const JUP_TOKEN_JSON_URL = 'https://tokens.jup.ag/tokens?tags=verified';

export async function GET() {
    try {
        const result = await Promise.all([
            env.external.NEXT_PUBLIC_SOLANA_DEV
                ? fetchJson<{ tokens: SplToken[] }>(TOKEN_JSON_URL, {
                      cache: 'force-cache',
                  })
                : null,
            fetchJson<JupToken[]>(JUP_TOKEN_JSON_URL, {
                cache: 'force-cache',
            }),
        ]);
        const [splResult, jupTokens] = result || [];

        return createSuccessResponseJson(uniqBy([...(splResult?.tokens || []), ...(jupTokens || [])], 'address'));
    } catch (error) {
        return createErrorResponseJson(getGatewayErrorMessage(error), {
            status: 502,
        });
    }
}
