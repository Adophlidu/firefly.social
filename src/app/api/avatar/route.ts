import { parseJson } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { LensHubABI } from '@/abis/LensHub.js';
import { CACHE_AGE_INDEFINITE_ON_DISK, LENS_HUB_PROXY_ADDRESS } from '@/constants/index.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface TokenUriMetadata {
    image: string;
}

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return createErrorResponseJson('Missing id', { status: 400 });

    try {
        const client = createWagmiPublicClient(EthereumChainId.Polygon);
        const data = await client.readContract({
            abi: LensHubABI,
            address: LENS_HUB_PROXY_ADDRESS,
            args: [id],
            functionName: 'tokenURI',
        });

        const jsonData = parseJson<TokenUriMetadata>(Buffer.from((data as string).split(',')[1], 'base64').toString());
        const base64Image = jsonData?.image.split(';base64,').pop();
        if (!base64Image) throw new Error('Image data not found in tokenURI');

        const svgImage = Buffer.from(base64Image, 'base64').toString('utf-8');

        return new Response(svgImage, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
            },
        });
    } catch (error) {
        return createErrorResponseJson(getGatewayErrorMessage(error, 'Failed to read tokenURI'), {
            status: 400,
        });
    }
}
