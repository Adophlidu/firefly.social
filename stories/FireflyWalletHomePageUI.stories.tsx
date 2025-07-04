/* cspell:disable */

import { Trans } from '@lingui/react/macro';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Address } from 'viem';

import {
    FireflyWalletHomePageUI,
    type FireflyWalletHomePageUIProps,
} from '@/components/FireflyWallet/FireflyWalletHomePageUI.js';
import { InitialProviders } from '@/components/InitialProviders.js';
import type { RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { SendTransactionModal } from '@/components/SendTransactionModal/SendTransactionModal.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { TokenItem } from '@/components/Tips/TokenItem.js';
import { NetworkType } from '@/constants/enum.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import * as controls from '@/modals/controls.js';
import { SearchRecipientModal } from '@/modals/SearchRecipientModal.js';
import { Snackbar } from '@/modals/Snackbar.js';
import { TokenSelectorModal } from '@/modals/TokenSelectorModal.js';
import type { Token } from '@/providers/types/Transfer.js';

const meta = {
    title: 'FireflyWallet/FireflyWalletHomePageUI',
    component: FireflyWalletHomePageUI,
} satisfies Meta<typeof FireflyWalletHomePageUI>;

export default meta;

const tokens: Array<Token<EthereumChainId, Address>> = [
    {
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
    } as Token<EthereumChainId, Address>,
    {
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
    },
];

function DefaultRender(props: FireflyWalletHomePageUIProps) {
    const [selectedToken, setSelectedToken] = useState<Token | undefined>();
    const [isOpenSendTransactionModal, setIsOpenSendTransactionModal] = useState(false);
    const [recipient, setRecipient] = useState<RecipientItemProps | undefined>();
    return (
        <>
            <SendTransactionModal
                open={isOpenSendTransactionModal}
                contentProps={
                    selectedToken
                        ? {
                              recipient,
                              token: selectedToken,
                              async onClickSearch() {
                                  const res = await controls.SearchRecipientModalRef.openAndWaitForClose();
                                  setRecipient(res);
                              },
                              async onClickChangeToken() {
                                  const fungibleToken = await controls.TokenSelectorModalRef.openAndWaitForClose({
                                      address: props.address!,
                                      networkType: NetworkType.Ethereum,
                                      isConnectRequest: false,
                                  });
                                  const token = fungibleToken?.__original__;
                                  if (token) setSelectedToken(token);
                              },
                              onSubmit(values) {
                                  console.log(values);
                              },
                          }
                        : undefined
                }
                onClose={() => setIsOpenSendTransactionModal(false)}
            />
            <FireflyWalletHomePageUI
                {...props}
                title={<Trans>Firefly EVM Wallet</Trans>}
                onSend={async () => {
                    const fungibleToken = await controls.TokenSelectorModalRef.openAndWaitForClose({
                        address: props.address!,
                        networkType: NetworkType.Ethereum,
                        isConnectRequest: false,
                    });
                    const token = fungibleToken?.__original__;
                    if (token) {
                        setSelectedToken(token);
                        setIsOpenSendTransactionModal(true);
                    }
                }}
                onReceive={() => enqueueSuccessMessage('Receive')}
                onSwap={() => enqueueSuccessMessage('Swap')}
            >
                <div className="flex w-full flex-col space-y-2">
                    <Tabs
                        variant="subtle"
                        onChange={(value) => enqueueSuccessMessage(`Switch Tab: ${value}`)}
                        value="token"
                    >
                        <Tab value="token">Token</Tab>
                        <Tab value="nft">NFT</Tab>
                        <Tab value="transactions">Transactions</Tab>
                    </Tabs>
                    {tokens.map((token) => (
                        <TokenItem token={token} key={token.id} className="duration-100 hover:bg-bg" />
                    ))}
                </div>
            </FireflyWalletHomePageUI>
        </>
    );
}

export const Default: StoryObj<typeof FireflyWalletHomePageUI> = {
    args: {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        balance: '0.00000512312',
    },
    render: (args) => (
        <InitialProviders>
            <Snackbar ref={controls.SnackbarRef.register} />
            <TokenSelectorModal ref={controls.TokenSelectorModalRef.register} />
            <SearchRecipientModal ref={controls.SearchRecipientModalRef.register} />
            <DefaultRender {...args} />
        </InitialProviders>
    ),
};
