/* cspell:disable */

import type { Meta, StoryObj } from '@storybook/react';
import type { Address } from 'viem';

import { SendTransactionModal } from '@/components/SendTransactionModal/SendTransactionModal.js';
import { SendTransactionModalContent } from '@/components/SendTransactionModal/SendTransactionModalContent.js';
import { NetworkType, Source } from '@/constants/enum.js';
import type { Token } from '@/providers/types/Transfer.js';

const meta = {
    title: 'FireflyWallet/SendTransactionModalContent',
    component: SendTransactionModalContent,
} satisfies Meta<typeof SendTransactionModalContent>;

export default meta;

const nativeToken = {
    amount: 0.003987788282433006,
    balance: '0.004',
    chain: 'base',
    chainId: 8453,
    chainLogoUrl: undefined,
    decimals: 18,
    display_symbol: null,
    id: 'base' as unknown as Address, // native token
    is_core: true,
    is_verified: true,
    is_wallet: true,
    logo_url: 'https://static.debank.com/image/coin/logo_url/eth/6443cdccced33e204d90cb723c632917.png',
    name: 'ETH',
    networkType: NetworkType.Ethereum,
    optimized_symbol: 'ETH',
    price: 2438.85,
    price_24h_change: 0.017023246889221647,
    protocol_id: '',
    raw_amount: '3987788282433006',
    raw_amount_hex_str: '0xe2adf50038dee',
    symbol: 'ETH',
    usdValue: 9.73,
} as Token;

const erc20Token = {
    amount: 1,
    balance: '1',
    chain: 'eth',
    chainId: 1,
    chainLogoUrl: 'https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png',
    decimals: 18,
    display_symbol: null,
    id: '0x69af81e73a73b40adf4f3d4223cd9b1ece623074',
    is_core: true,
    is_verified: true,
    is_wallet: true,
    logo_url:
        'https://static.debank.com/image/eth_token/logo_url/0x69af81e73a73b40adf4f3d4223cd9b1ece623074/baddad0cec04d9361bd6b4c594ccf704.png',
    name: 'Mask Network',
    networkType: NetworkType.Ethereum,
    optimized_symbol: 'MASK',
    price: 1.2755199217338928,
    price_24h_change: 0.03136711660076875,
    protocol_id: 'maskio',
    raw_amount: '1000000000000000000',
    raw_amount_hex_str: '0xde0b6b3a7640000',
    symbol: 'MASK',
    time_at: 1613723201,
    usdValue: 1.28,
};

export const Default: StoryObj<typeof SendTransactionModalContent> = {
    render() {
        return (
            <div style={{ width: '480px' }}>
                <SendTransactionModalContent token={nativeToken} />
            </div>
        );
    },
};

export const OnlyAddressReceipt: StoryObj<typeof SendTransactionModalContent> = {
    render() {
        return (
            <div style={{ width: '480px' }}>
                <SendTransactionModalContent
                    token={nativeToken}
                    recipient={{
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                    }}
                />
            </div>
        );
    },
};

export const WithEnsReceipt: StoryObj<typeof SendTransactionModalContent> = {
    render() {
        return (
            <div style={{ width: '480px' }}>
                <SendTransactionModalContent
                    token={nativeToken}
                    recipient={{
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                        avatar: 'https://stamp.firefly.land/avatar/vitalik.eth?s=300&time=1748602800',
                        ens: 'vitalik.eth',
                    }}
                />
            </div>
        );
    },
};

export const WithSocialReceipt: StoryObj<typeof SendTransactionModalContent> = {
    render() {
        return (
            <div style={{ width: '480px' }}>
                <SendTransactionModalContent
                    token={nativeToken}
                    recipient={{
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                        avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b663cd63-fecf-4d0f-7f87-0e0b6fd42800/original',
                        username: 'Vitalik Buterin',
                        handle: 'vitalik.eth',
                        source: Source.Farcaster,
                    }}
                />
            </div>
        );
    },
};

export const Modal: StoryObj<typeof SendTransactionModal> = {
    render() {
        return (
            <SendTransactionModal
                open
                contentProps={{
                    token: nativeToken,
                    recipient: {
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                        avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b663cd63-fecf-4d0f-7f87-0e0b6fd42800/original',
                        username: 'Vitalik Buterin',
                        handle: 'vitalik.eth',
                        source: Source.Farcaster,
                    },
                }}
            />
        );
    },
};
