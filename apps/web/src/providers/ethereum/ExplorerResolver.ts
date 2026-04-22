/* cspell:disable */

import urlcat from 'urlcat';

const BLOCKSCAN_URL = 'https://blockscan.com';

export const BlockScanExplorerResolver = {
    addressLink(_chainId: number, address: string) {
        if (!address) return;
        return urlcat(BLOCKSCAN_URL, '/address/:address', { address });
    },
    transactionLink(_chainId: number, id: string) {
        if (!id) return;
        return urlcat(BLOCKSCAN_URL, '/tx/:id', { id });
    },
};
