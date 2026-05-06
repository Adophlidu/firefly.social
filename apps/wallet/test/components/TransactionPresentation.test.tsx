import { solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { formatAddress } from '@dimensiondev/web3/utils';
import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
    buildTransactionPresentation,
    formatTransactionAmount,
    getTransactionExplorerUrl,
    type TransactionPresentation,
} from '@/components/TransactionPresentation.js';
import {
    TransactionHistoryCategory,
    type TransactionHistoryItem,
    type TransactionHistoryNFTAction,
    type TransactionHistoryToken,
    type TransactionHistoryTokenAction,
    TransactionState,
} from '@/providers/types/Firefly.js';

import { walletHistoryTransactionFixtures } from '../fixtures/walletHistoryTransactions.js';

const walletAddress = evmAddress('1');
const senderAddress = evmAddress('2');
const recipientAddress = evmAddress('3');
const spenderAddress = evmAddress('4');
const transactionToAddress = evmAddress('5');
const tokenContractAddress = evmAddress('6');
const usdcAddress = evmAddress('7');
const wethAddress = evmAddress('8');
const transactionHash = `0x${'a'.repeat(64)}`;
const maxUint128 = '340282366920938463463374607431768211455';
const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const solanaSenderAddress = '9xQeWvG816bUx9EPfvn8vJ6VQ4p2ZPp2a7S4gq8R7s9K';
const solanaRecipientAddress = '8kJ2gN3w3M7bP8X9vL2qR5tY1cA6sH4zD9eF7uB2nC1m';

function evmAddress(char: string) {
    return `0x${char.repeat(40)}`;
}

function token(overrides: Partial<TransactionHistoryToken> = {}): TransactionHistoryToken {
    const symbol = overrides.symbol ?? 'USDC';

    return {
        address: usdcAddress,
        symbol,
        name: `${symbol} Token`,
        logo: `https://example.com/${symbol.toLowerCase()}.png`,
        decimal: 6,
        price: '1',
        ...overrides,
    };
}

function tokenAction(overrides: Partial<TransactionHistoryTokenAction> = {}): TransactionHistoryTokenAction {
    const actionToken = overrides.token ?? token();
    const { token: _token, ...rest } = overrides;

    return {
        token: actionToken,
        amount: '1.2',
        user_address: walletAddress,
        recipient: recipientAddress,
        sender: senderAddress,
        ...rest,
    };
}

function nftAction(overrides: Partial<TransactionHistoryNFTAction> = {}): TransactionHistoryNFTAction {
    const nft = overrides.nft ?? {
        address: evmAddress('9'),
        symbol: 'MASK',
        name: 'Mask NFT',
        token_id: '1',
        logo: 'https://example.com/mask.png',
    };
    const { nft: _nft, ...rest } = overrides;

    return {
        nft,
        amount: '1',
        user_address: walletAddress,
        recipient: recipientAddress,
        sender: senderAddress,
        ...rest,
    };
}

function transaction(overrides: Partial<TransactionHistoryItem> = {}): TransactionHistoryItem {
    return {
        chain_id: 1,
        hash: transactionHash,
        block_number: 12_345,
        tx_status: TransactionState.Success,
        project_logo: '',
        project_name: '',
        timestamp: '1710000000',
        to_address: transactionToAddress,
        from_address: walletAddress,
        token_sends: [],
        token_receives: [],
        nft_receives: [],
        nft_sends: [],
        category: TransactionHistoryCategory.TokenReceive,
        ...overrides,
    };
}

function expectAssetEffectAmounts(presentation: TransactionPresentation) {
    expect(presentation.assetEffect?.type).toBe('amounts');
    if (presentation.assetEffect?.type !== 'amounts') throw new Error('Expected amount asset effect presentation');
    return presentation.assetEffect.amounts;
}

function getApiDevSample(category: TransactionHistoryCategory) {
    const item = walletHistoryTransactionFixtures.find((transaction) => transaction.category === category);
    expect(item).toBeDefined();
    return item!;
}

describe('formatTransactionAmount', () => {
    it('normalizes missing, regular, and tiny values for transaction displays', () => {
        expect(formatTransactionAmount(undefined)).toBe('-');
        expect(formatTransactionAmount('1.2')).toBe('1.20');
        expect(formatTransactionAmount('1234.567')).toBe('1,234.57');
        expect(formatTransactionAmount('0.123456')).toBe('0.1235');
        expect(isValidElement(formatTransactionAmount('0.000000123'))).toBe(true);
    });
});

describe('buildTransactionPresentation', () => {
    it('builds expected asset effects from pinned api-dev wallet history samples', () => {
        const receiveSample = getApiDevSample(TransactionHistoryCategory.TokenReceive);
        const receive = buildTransactionPresentation(receiveSample);
        expect(expectAssetEffectAmounts(receive)[0]).toMatchObject({
            id: 'received',
            text: '0.1',
            symbol: 'POL',
            prefix: '+',
            className: 'text-success',
        });
        expect(receive.assetRows[0]).toMatchObject({
            id: 'received',
            tokenLogo: receiveSample.token_receives[0].token.logo,
            tokenSymbol: 'POL',
            amountText: '0.1',
        });

        const sendSample = getApiDevSample(TransactionHistoryCategory.TokenSend);
        const send = buildTransactionPresentation(sendSample);
        expect(send.toAddress).toBe(sendSample.token_sends[0].recipient);
        expect(expectAssetEffectAmounts(send)[0]).toMatchObject({
            id: 'sent',
            text: '0.0008',
            symbol: 'ETH',
            prefix: '-',
        });

        const swap = buildTransactionPresentation(getApiDevSample(TransactionHistoryCategory.TokenSwap));
        expect(swap.icon.type).toBe('pair');
        expect(expectAssetEffectAmounts(swap).map((amount) => amount.id)).toEqual(['received', 'sent']);
        expect(swap.assetRows.map((row) => row.id)).toEqual(['sent', 'received']);
        expect(swap.assetRows[0]).toMatchObject({
            tokenLogo: null,
            tokenSymbol: 'LIQ',
            amountPrefix: '-',
        });

        const approveSample = getApiDevSample(TransactionHistoryCategory.TokenApprove);
        const approve = buildTransactionPresentation(approveSample);
        expect(approve.contractAddress).toBe(approveSample.to_address);
        expect(approve.subtitleTarget).toMatchObject({
            type: 'project',
            address: approveSample.token_approve!.spender_address,
        });
        expect(expectAssetEffectAmounts(approve)[0]).toMatchObject({
            id: 'approved-token',
            text: '47,912.86',
            symbol: 'LIQ',
        });
        expect(approve.assetRows[0]).toMatchObject({
            id: 'approved',
            tokenLogo: null,
            amountText: '47,912.86',
            address: approveSample.token_approve!.token.address,
        });
        expect(approve.assetRows[0].amount).toBeUndefined();

        const bridge = buildTransactionPresentation(getApiDevSample(TransactionHistoryCategory.TokenBridge));
        expect(bridge.listSubtitle).toMatchObject({
            type: 'via-project',
            projectName: 'Firefly',
        });
        expect(expectAssetEffectAmounts(bridge).map((amount) => amount.id)).toEqual(['received', 'sent']);

        const contract = buildTransactionPresentation(getApiDevSample(TransactionHistoryCategory.ContractInteraction));
        expect(contract.icon).toEqual({ type: 'document' });
        expect(contract.assetEffect).toBeNull();
        expect(contract.assetRows).toEqual([]);
    });

    it('builds the shared receive presentation without changing amount or sender semantics', () => {
        const receivedToken = tokenAction({
            amount: '1.2',
            recipient: walletAddress,
            sender: senderAddress,
        });
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.TokenReceive,
                from_address: senderAddress,
                to_address: walletAddress,
                token_receives: [receivedToken],
            }),
        );

        const amounts = expectAssetEffectAmounts(presentation);
        expect(presentation.fromAddress).toBe(senderAddress);
        expect(presentation.toAddress).toBe(walletAddress);
        expect(presentation.profileAddress).toBe(senderAddress);
        expect(presentation.listSubtitle).toEqual({
            type: 'from-address',
            text: formatAddress(senderAddress, 4),
        });
        expect(amounts[0]).toMatchObject({
            id: 'received',
            text: '1.20',
            symbol: 'USDC',
            prefix: '+',
            className: 'text-success',
        });
        expect(presentation.assetRows[0]).toMatchObject({
            id: 'received',
            label: 'received',
            tokenSymbol: 'USDC',
            amountText: '1.20',
            amountPrefix: '+',
            amountClassName: 'text-success',
            address: usdcAddress,
        });
        expect(presentation.subtitleTarget).toEqual({
            type: 'from-wallet',
            address: senderAddress,
        });
    });

    it('prefers token action recipients for send presentation addresses', () => {
        const sentToken = tokenAction({
            amount: '2',
            sender: walletAddress,
            recipient: recipientAddress,
        });
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.TokenSend,
                from_address: walletAddress,
                to_address: transactionToAddress,
                token_sends: [sentToken],
            }),
        );

        const amounts = expectAssetEffectAmounts(presentation);
        expect(presentation.fromAddress).toBe(walletAddress);
        expect(presentation.toAddress).toBe(recipientAddress);
        expect(presentation.listSubtitle).toEqual({
            type: 'to-address',
            text: formatAddress(recipientAddress, 4),
        });
        expect(amounts[0]).toMatchObject({
            id: 'sent',
            text: '2',
            symbol: 'USDC',
            prefix: '-',
        });
        expect(presentation.assetRows[0]).toMatchObject({
            id: 'sent',
            label: 'sent',
            amountText: '2',
            amountPrefix: '-',
            address: usdcAddress,
        });
        expect(presentation.subtitleTarget).toEqual({
            type: 'to-wallet',
            address: recipientAddress,
        });
    });

    it('keeps swap list amounts and detail rows in the original display order', () => {
        const sentToken = tokenAction({
            amount: '2',
            token: token({
                address: wethAddress,
                symbol: 'WETH',
                name: 'Wrapped Ether',
                decimal: 18,
                price: '3500',
            }),
        });
        const receivedToken = tokenAction({
            amount: '7000',
            token: token({
                address: usdcAddress,
                symbol: 'USDC',
                name: 'USD Coin',
            }),
        });
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.TokenSwap,
                project_name: 'Uniswap',
                to_address: transactionToAddress,
                token_sends: [sentToken],
                token_receives: [receivedToken],
            }),
        );

        const amounts = expectAssetEffectAmounts(presentation);
        expect(presentation.icon.type).toBe('pair');
        expect(presentation.listSubtitle).toEqual({
            type: 'on-project',
            projectName: 'Uniswap',
            fallbackAddress: transactionToAddress,
        });
        expect(amounts.map((amount) => amount.id)).toEqual(['received', 'sent']);
        expect(amounts[0]).toMatchObject({
            text: '7,000',
            symbol: 'USDC',
            prefix: '+',
            className: 'text-success',
        });
        expect(amounts[1]).toMatchObject({
            text: '2',
            symbol: 'WETH',
            prefix: '-',
            compact: true,
        });
        expect(presentation.assetRows.map((row) => row.id)).toEqual(['sent', 'received']);
        expect(presentation.assetRows[1]).toMatchObject({
            label: 'received',
            amountPrefix: '+',
            amountClassName: 'text-success',
            showLabelMarginTop: true,
        });
        expect(presentation.subtitleTarget).toMatchObject({
            type: 'contract',
            address: transactionToAddress,
        });
    });

    it('keeps approve spender and token contract addresses separate', () => {
        const approvalToken = token({
            address: tokenContractAddress,
            symbol: 'USDC',
            name: 'USD Coin',
        });
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.TokenApprove,
                project_name: 'Permit2',
                project_logo: 'https://example.com/permit2.png',
                to_address: tokenContractAddress,
                token_approve: {
                    token: approvalToken,
                    amount: maxUint128,
                    spender_address: spenderAddress,
                },
            }),
        );

        const amounts = expectAssetEffectAmounts(presentation);
        expect(presentation.contractAddress).toBe(tokenContractAddress);
        expect(presentation.listSubtitle).toEqual({
            type: 'plain-address',
            address: spenderAddress,
        });
        expect(presentation.subtitleTarget).toEqual({
            type: 'project',
            address: spenderAddress,
            logo: 'https://example.com/permit2.png',
            name: 'Permit2',
        });
        expect(amounts[0]).toMatchObject({
            id: 'approved-token',
            symbol: 'USDC',
        });
        expect(isValidElement(amounts[0].text)).toBe(true);
        expect(presentation.assetRows[0]).toMatchObject({
            id: 'approved',
            label: 'approved',
            amountPrefix: '',
            address: tokenContractAddress,
        });
        expect(isValidElement(presentation.assetRows[0].amountText)).toBe(true);
        expect(presentation.assetRows[0].amount).toBeUndefined();
    });

    it('uses revoke spender for subtitle target but keeps the contract row on transaction.to_address', () => {
        const approvalToken = token({
            address: tokenContractAddress,
            symbol: 'USDC',
            name: 'USD Coin',
        });
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.TokenRevoke,
                to_address: tokenContractAddress,
                token_approve: {
                    token: approvalToken,
                    amount: maxUint256,
                    spender_address: spenderAddress,
                },
            }),
        );

        const amounts = expectAssetEffectAmounts(presentation);
        expect(presentation.contractAddress).toBe(tokenContractAddress);
        expect(presentation.listSubtitle).toEqual({
            type: 'plain-address',
            address: spenderAddress,
        });
        expect(presentation.subtitleTarget).toEqual({
            type: 'project',
            address: spenderAddress,
            logo: '',
            rawText: spenderAddress,
        });
        expect(amounts[0]).toEqual({
            id: 'revoked-token',
            text: 'USDC',
        });
        expect(presentation.assetRows[0]).toMatchObject({
            id: 'revoked',
            label: 'revoked',
            amountPrefix: '',
            address: tokenContractAddress,
        });
        expect(isValidElement(presentation.assetRows[0].amountText)).toBe(true);
    });

    it('falls back to the contract document icon when an interaction has no display asset', () => {
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.ContractInteraction,
                to_address: transactionToAddress,
            }),
        );

        expect(presentation.icon).toEqual({ type: 'document' });
        expect(presentation.assetEffect).toBeNull();
        expect(presentation.assetRows).toEqual([]);
        expect(presentation.listSubtitle).toEqual({
            type: 'with-address',
            text: formatAddress(transactionToAddress, 4),
        });
        expect(presentation.subtitleTarget).toEqual({
            type: 'contract',
            address: transactionToAddress,
            logo: undefined,
        });
    });

    it('does not throw when an NFT transaction is missing action payloads', () => {
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.NftReceive,
                nft_receives: [],
                nft_sends: [],
            }),
        );

        expect(presentation.icon).toEqual({
            type: 'token',
            icon: undefined,
            symbol: undefined,
            name: undefined,
            disableBadge: false,
        });
        expect(presentation.assetEffect).toEqual({
            type: 'nft',
            address: undefined,
            symbol: undefined,
            explorerUrl: undefined,
        });
        expect(presentation.assetRows).toEqual([]);
    });

    it('uses Solana token action addresses and disables token badges for Solana history', () => {
        const receivedToken = tokenAction({
            amount: '0.5',
            recipient: solanaRecipientAddress,
            sender: solanaSenderAddress,
        });
        const presentation = buildTransactionPresentation(
            transaction({
                chain_id: solana.id,
                category: TransactionHistoryCategory.TokenReceive,
                from_address: '',
                to_address: '',
                token_receives: [receivedToken],
            }),
        );

        expect(presentation.networkType).toBe(NetworkType.Solana);
        expect(presentation.isSolana).toBe(true);
        expect(presentation.fromAddress).toBe(solanaSenderAddress);
        expect(presentation.toAddress).toBe(solanaRecipientAddress);
        expect(presentation.icon).toMatchObject({
            type: 'token',
            symbol: 'USDC',
            disableBadge: true,
        });
        expect(presentation.listSubtitle).toEqual({
            type: 'from-address',
            text: formatAddress(solanaSenderAddress, 4),
        });
    });

    it('keeps NFT action payloads readable when they are present', () => {
        const nft = nftAction({
            recipient: walletAddress,
            sender: senderAddress,
        });
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.NftReceive,
                from_address: senderAddress,
                to_address: walletAddress,
                nft_receives: [nft],
            }),
        );

        expect(presentation.primaryNft).toBe(nft);
        expect(presentation.icon).toMatchObject({
            type: 'token',
            symbol: 'MASK',
            name: 'Mask NFT',
        });
        expect(presentation.assetEffect).toMatchObject({
            type: 'nft',
            address: nft.nft.address,
            symbol: 'MASK',
        });
        expect(presentation.listSubtitle).toEqual({
            type: 'from-address',
            text: formatAddress(senderAddress, 4),
        });
        expect(presentation.subtitleTarget).toBeNull();
    });

    it('returns null subtitle target for NFT send and mint categories', () => {
        const nftSend = nftAction({
            sender: walletAddress,
            recipient: recipientAddress,
        });
        const sendPresentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.NftSend,
                from_address: walletAddress,
                to_address: recipientAddress,
                nft_sends: [nftSend],
            }),
        );
        expect(sendPresentation.subtitleTarget).toBeNull();
        expect(sendPresentation.assetEffect).toMatchObject({
            type: 'nft',
            address: nftSend.nft.address,
            symbol: 'MASK',
        });

        const nftMint = nftAction({
            sender: transactionToAddress,
            recipient: walletAddress,
        });
        const mintPresentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.NftMint,
                from_address: transactionToAddress,
                to_address: walletAddress,
                nft_receives: [nftMint],
            }),
        );
        expect(mintPresentation.subtitleTarget).toBeNull();
        expect(mintPresentation.assetEffect).toMatchObject({
            type: 'nft',
            address: nftMint.nft.address,
            symbol: 'MASK',
        });
    });

    it('returns null asset effect and empty rows for revoke without token_approve', () => {
        const presentation = buildTransactionPresentation(
            transaction({
                category: TransactionHistoryCategory.TokenRevoke,
                to_address: transactionToAddress,
            }),
        );

        expect(presentation.assetEffect).toBeNull();
        expect(presentation.assetRows).toEqual([]);
        expect(presentation.subtitleTarget).toMatchObject({
            type: 'project',
            address: transactionToAddress,
            logo: '',
            rawText: undefined,
        });
    });

    it('returns undefined explorer URL for transaction without hash', () => {
        const result = getTransactionExplorerUrl(transaction({ hash: '' }));
        expect(result).toBeUndefined();
    });
});
