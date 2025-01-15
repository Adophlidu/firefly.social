import { StatusCodes } from 'http-status-codes';

import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import type { SplToken } from '@/providers/types/Solana.js';

const TOKEN_JSON_URL =
    'https://raw.githubusercontent.com/solana-labs/token-list/refs/heads/main/src/tokens/solana.tokenlist.json';

export async function GET() {
    try {
        const result = await fetchJSON<{ tokens: SplToken[] }>(TOKEN_JSON_URL, {
            cache: 'force-cache',
        });
        return createSuccessResponseJSON(result.tokens);
    } catch (error) {
        return createErrorResponseJSON(getGatewayErrorMessage(error), {
            status: StatusCodes.BAD_GATEWAY,
        });
    }
}
