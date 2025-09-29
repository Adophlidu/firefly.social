import { resolveNFTDataFromUrl } from '@/helpers/resolveNFTDataFromUrl.js';
import { describe, expect, test } from 'vitest';

describe('resolveNFTDataFromUrl', () => {
    test.each([
        [
            'https://magiceden.io/item-details/2fsTwf4ZYHPRkfyYEAEr93hgq3qnpHZHTLQYQd92JP1E',
            {
                chainId: 101,
                address: '2fsTwf4ZYHPRkfyYEAEr93hgq3qnpHZHTLQYQd92JP1E',
                tokenId: '0',
            },
        ],
        [
            'https://collectors.poap.xyz/token/6329208',
            {
                chainId: 1,
                address: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
                tokenId: '6329208',
            },
        ],
        [
            'https://opensea.io/item/base/0xba5e05cb26b78eda3a2f8e3b3814726305dcac83/285',
            {
                chainId: 8453,
                address: '0xba5e05cb26b78eda3a2f8e3b3814726305dcac83',
                tokenId: '285',
            },
        ],
        [
            'https://blur.io/eth/asset/0x23581767a106ae21c074b2276d25e5c3e136a68b/9430',
            {
                chainId: 1,
                address: '0x23581767a106ae21c074b2276d25e5c3e136a68b',
                tokenId: '9430',
            },
        ],
        [
            'chain://eip155:1/erc721:0xd8EA7A2F786a8baDdfd14DfC4A836bd4761E05fa/1577',
            {
                chainId: 1,
                address: '0xd8EA7A2F786a8baDdfd14DfC4A836bd4761E05fa',
                tokenId: '1577',
            },
        ],
        [
            'nft://7777777/0x30b8cD2E3Аc893e237577999760652a847509E39/4',
            {
                chainId: 7777777,
                address: '0x30b8cD2E3Аc893e237577999760652a847509E39',
                tokenId: '4',
            },
        ],
        [
            'https://optimism.nftscan.com/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0',
            {
                chainId: 10,
                address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                tokenId: '0',
            },
        ],
    ])('computeSize(%d, %d) with options %o', (link, expected) => {
        expect(resolveNFTDataFromUrl(link)).toEqual(expected);
    });
});
