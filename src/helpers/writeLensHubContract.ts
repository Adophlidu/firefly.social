import { writeContract } from 'wagmi/actions';

import { LensHubABI } from '@/abis/LensHub.js';
import { config } from '@/configs/wagmiClient.js';
import { LENS_HUB_PROXY_ADDRESS } from '@/constants/index.js';

export function writeLensHubContract(functionName: string, args: Array<string | string[]>) {
    return writeContract(config, {
        abi: LensHubABI,
        address: LENS_HUB_PROXY_ADDRESS,
        args,
        functionName,
    });
}
