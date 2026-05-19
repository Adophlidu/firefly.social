import { NetworkType, SourceInURL } from '@dimensiondev/enums';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';
import type { Address } from 'viem';

import { getWalletProfileByAddressOrEns } from '@/providers/firefly/endpoint/getWalletProfileByAddressOrEns.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BlockedUsersResponse, WalletProfile } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getBlockedWallets(indicator?: PageIndicator): Promise<Pageable<WalletProfile, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/mutelist', {
        size: 20,
        page: indicator?.id ?? 1,
        platform: SourceInURL.Wallet,
    });
    const response = await fireflySessionHolder.fetch<BlockedUsersResponse>(url);

    const data = await Promise.all(
        (response.data?.blocks ?? []).map(async (item) => {
            const walletProfile = await getWalletProfileByAddressOrEns(item.address, true);
            return {
                ...(walletProfile || {
                    address: item.address as Address,
                    blockchain: NetworkType.Ethereum,
                    is_connected: false,
                    verifiedSources: [],
                }),
                blocked: true,
            };
        }),
    );

    return createPageable(
        data,
        createIndicator(indicator),
        response.data?.nextPage ? createNextIndicator(indicator, `${response.data?.nextPage}`) : undefined,
    );
}
