import { encodeFunctionData, erc20Abi, maxUint256, parseUnits } from 'viem';
import { describe, expect, it } from 'vitest';

import {
    applyAmountToTypedDataSession,
    encodeErc20ApproveCalldata,
    tryParseErc20ApproveFromCalldata,
    tryParseErc20ApproveSession,
    tryParseTokenApprovalTypedData,
} from '@/helpers/evm/tokenApprovalSession.js';

const spender = '0x1111111111111111111111111111111111111111' as const;
const token = '0x2222222222222222222222222222222222222222' as const;

describe('tryParseErc20ApproveFromCalldata', () => {
    it('returns null for non-approve data', () => {
        const transfer = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [spender, 1n],
        });
        expect(tryParseErc20ApproveFromCalldata(transfer)).toBeNull();
        expect(tryParseErc20ApproveFromCalldata(undefined)).toBeNull();
    });

    it('decodes approve spender and amount', () => {
        const amount = parseUnits('100', 6);
        const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender, amount],
        });
        expect(tryParseErc20ApproveFromCalldata(data)).toEqual({
            spender,
            amount,
        });
    });
});

describe('tryParseErc20ApproveSession', () => {
    it('returns null when token address is invalid', () => {
        const data = encodeErc20ApproveCalldata(spender, 1n);
        expect(tryParseErc20ApproveSession('not-an-address', data)).toBeNull();
    });

    it('returns full session', () => {
        const data = encodeErc20ApproveCalldata(spender, maxUint256);
        const session = tryParseErc20ApproveSession(token, data);
        expect(session).toEqual({
            kind: 'erc20Approve',
            tokenAddress: token,
            spender,
            amount: maxUint256,
        });
    });
});

describe('tryParseTokenApprovalTypedData', () => {
    it('parses EIP-2612 Permit', () => {
        const json = JSON.stringify({
            types: {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' },
                ],
                Permit: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                ],
            },
            primaryType: 'Permit',
            domain: {
                name: 'Mock',
                version: '1',
                chainId: 1,
                verifyingContract: token,
            },
            message: {
                owner: '0x3333333333333333333333333333333333333333',
                spender,
                value: '123456789',
                nonce: '0',
                deadline: '9999999999',
            },
        });
        const session = tryParseTokenApprovalTypedData(json);
        expect(session?.kind).toBe('eip2612Permit');
        if (session?.kind === 'eip2612Permit') {
            expect(session.tokenAddress).toBe(token);
            expect(session.spender).toBe(spender);
            expect(session.amount).toBe(123456789n);
            expect(session.typedData.primaryType).toBe('Permit');
        }
    });

    it('parses Permit2 PermitSingle', () => {
        const json = JSON.stringify({
            types: {
                PermitDetails: [
                    { name: 'token', type: 'address' },
                    { name: 'amount', type: 'uint160' },
                    { name: 'expiration', type: 'uint48' },
                    { name: 'nonce', type: 'uint48' },
                ],
                PermitSingle: [
                    { name: 'details', type: 'PermitDetails' },
                    { name: 'spender', type: 'address' },
                    { name: 'sigDeadline', type: 'uint256' },
                ],
            },
            primaryType: 'PermitSingle',
            domain: { name: 'Permit2', chainId: 1, verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' },
            message: {
                details: {
                    token,
                    amount: '420000',
                    expiration: '0',
                    nonce: '0',
                },
                spender,
                sigDeadline: '9999999999',
            },
        });
        const session = tryParseTokenApprovalTypedData(json);
        expect(session?.kind).toBe('permit2Single');
        if (session?.kind === 'permit2Single') {
            expect(session.tokenAddress).toBe(token);
            expect(session.spender).toBe(spender);
            expect(session.amount).toBe(420000n);
        }
    });

    it('returns null for PermitBatch', () => {
        const json = JSON.stringify({
            types: {},
            primaryType: 'PermitBatch',
            domain: {},
            message: {},
        });
        expect(tryParseTokenApprovalTypedData(json)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
        expect(tryParseTokenApprovalTypedData('')).toBeNull();
        expect(tryParseTokenApprovalTypedData('not json')).toBeNull();
    });
});

describe('applyAmountToTypedDataSession', () => {
    it('updates Permit value', () => {
        const json = JSON.stringify({
            types: {
                Permit: [{ name: 'value', type: 'uint256' }],
            },
            primaryType: 'Permit',
            domain: { verifyingContract: token },
            message: { spender, value: '1', nonce: '0', deadline: '1' },
        });
        const session = tryParseTokenApprovalTypedData(json);
        expect(session?.kind).toBe('eip2612Permit');
        if (session?.kind === 'eip2612Permit') {
            const next = applyAmountToTypedDataSession(session, 99n);
            const parsed = JSON.parse(next) as { message: { value: string } };
            expect(parsed.message.value).toBe('99');
        }
    });

    it('updates PermitSingle details.amount', () => {
        const json = JSON.stringify({
            types: {
                PermitDetails: [
                    { name: 'token', type: 'address' },
                    { name: 'amount', type: 'uint160' },
                    { name: 'expiration', type: 'uint48' },
                    { name: 'nonce', type: 'uint48' },
                ],
                PermitSingle: [
                    { name: 'details', type: 'PermitDetails' },
                    { name: 'spender', type: 'address' },
                    { name: 'sigDeadline', type: 'uint256' },
                ],
            },
            primaryType: 'PermitSingle',
            domain: {},
            message: {
                details: { token, amount: '1', expiration: '0', nonce: '0' },
                spender,
                sigDeadline: '1',
            },
        });
        const session = tryParseTokenApprovalTypedData(json);
        expect(session?.kind).toBe('permit2Single');
        if (session?.kind === 'permit2Single') {
            const next = applyAmountToTypedDataSession(session, 77n);
            const parsed = JSON.parse(next) as { message: { details: { amount: string } } };
            expect(parsed.message.details.amount).toBe('77');
        }
    });
});
