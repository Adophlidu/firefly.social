import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getBalanceOf } from '@/helpers/getBalanceOf.js';
import type { Address } from 'viem';

// Mock wagmi actions
const mockGetBalance = vi.fn();
const mockMulticall = vi.fn();

vi.mock('wagmi/actions', () => ({
    getBalance: (...args: unknown[]) => mockGetBalance(...args),
    multicall: (...args: unknown[]) => mockMulticall(...args),
}));

// Mock isZeroAddress helper
const mockIsZeroAddress = vi.fn();
vi.mock('@/helpers/isZeroAddress.js', () => ({
    isZeroAddress: (...args: unknown[]) => mockIsZeroAddress(...args),
}));

// Mock wagmiConfig
vi.mock('@/configs/wagmiClient.js', () => ({
    wagmiConfig: {},
}));

describe('getBalanceOf', () => {
    const chainId = 1;
    const account = '0x1234567890123456789012345678901234567890' as Address;
    const tokenAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address;
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when address is undefined', () => {
        it('should call getBalance with account address', async () => {
            const mockBalance = {
                value: BigInt('1000000000000000000'),
                decimals: 18,
                symbol: 'ETH',
            };
            mockGetBalance.mockResolvedValue(mockBalance);

            const result = await getBalanceOf(chainId, account, undefined);

            expect(mockIsZeroAddress).not.toHaveBeenCalled();
            expect(mockGetBalance).toHaveBeenCalledWith(expect.any(Object), {
                chainId,
                address: account,
                blockTag: 'latest',
            });
            expect(mockMulticall).not.toHaveBeenCalled();
            expect(result).toEqual(mockBalance);
        });
    });

    describe('when address is zero address', () => {
        it('should call getBalance instead of multicall', async () => {
            const mockBalance = {
                value: BigInt('2000000000000000000'),
                decimals: 18,
                symbol: 'ETH',
            };
            mockIsZeroAddress.mockReturnValue(true);
            mockGetBalance.mockResolvedValue(mockBalance);

            const result = await getBalanceOf(chainId, account, zeroAddress);

            expect(mockIsZeroAddress).toHaveBeenCalledWith(zeroAddress);
            expect(mockGetBalance).toHaveBeenCalledWith(expect.any(Object), {
                chainId,
                address: account,
                blockTag: 'latest',
            });
            expect(mockMulticall).not.toHaveBeenCalled();
            expect(result).toEqual(mockBalance);
        });
    });

    describe('when address is a valid ERC20 token address', () => {
        it('should call multicall with correct parameters and return token balance', async () => {
            const balanceValue = BigInt('5000000000000000000');
            const decimals = 18n;
            const symbol = 'USDT';

            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: balanceValue },
                { status: 'success', result: decimals },
                { status: 'success', result: symbol },
            ]);

            const result = await getBalanceOf(chainId, account, tokenAddress);

            expect(mockIsZeroAddress).toHaveBeenCalledWith(tokenAddress);
            expect(mockGetBalance).not.toHaveBeenCalled();
            expect(mockMulticall).toHaveBeenCalledWith(expect.any(Object), {
                contracts: [
                    {
                        abi: expect.any(Array),
                        address: tokenAddress,
                        functionName: 'balanceOf',
                        args: [account],
                    },
                    {
                        abi: expect.any(Array),
                        address: tokenAddress,
                        functionName: 'decimals',
                    },
                    {
                        abi: expect.any(Array),
                        address: tokenAddress,
                        functionName: 'symbol',
                    },
                ],
                chainId,
            });
            expect(result).toEqual({
                value: balanceValue,
                decimals,
                symbol,
            });
        });

        it('should handle different token decimals', async () => {
            const balanceValue = BigInt('1000000');
            const decimals = 6n;
            const symbol = 'USDC';

            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: balanceValue },
                { status: 'success', result: decimals },
                { status: 'success', result: symbol },
            ]);

            const result = await getBalanceOf(chainId, account, tokenAddress);

            expect(result).toEqual({
                value: balanceValue,
                decimals,
                symbol,
            });
        });

        it('should handle zero balance', async () => {
            const balanceValue = BigInt('0');
            const decimals = 18n;
            const symbol = 'DAI';

            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: balanceValue },
                { status: 'success', result: decimals },
                { status: 'success', result: symbol },
            ]);

            const result = await getBalanceOf(chainId, account, tokenAddress);

            expect(result).toEqual({
                value: balanceValue,
                decimals,
                symbol,
            });
        });
    });

    describe('error handling', () => {
        it('should throw error when balanceOf call fails', async () => {
            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'failure', error: new Error('RPC error') },
                { status: 'success', result: 18n },
                { status: 'success', result: 'USDT' },
            ]);

            await expect(getBalanceOf(chainId, account, tokenAddress)).rejects.toThrow(
                `Failed to fetch token balance or decimals for account=${account} address=${tokenAddress} on chain: ${chainId}`,
            );
        });

        it('should throw error when decimals call fails', async () => {
            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: BigInt('1000000') },
                { status: 'failure', error: new Error('RPC error') },
                { status: 'success', result: 'USDT' },
            ]);

            await expect(getBalanceOf(chainId, account, tokenAddress)).rejects.toThrow(
                `Failed to fetch token balance or decimals for account=${account} address=${tokenAddress} on chain: ${chainId}`,
            );
        });

        it('should throw error when symbol call fails', async () => {
            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: BigInt('1000000') },
                { status: 'success', result: 18n },
                { status: 'failure', error: new Error('RPC error') },
            ]);

            await expect(getBalanceOf(chainId, account, tokenAddress)).rejects.toThrow(
                `Failed to fetch token balance or decimals for account=${account} address=${tokenAddress} on chain: ${chainId}`,
            );
        });

        it('should throw error when multiple calls fail', async () => {
            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'failure', error: new Error('RPC error') },
                { status: 'failure', error: new Error('RPC error') },
                { status: 'failure', error: new Error('RPC error') },
            ]);

            await expect(getBalanceOf(chainId, account, tokenAddress)).rejects.toThrow(
                `Failed to fetch token balance or decimals for account=${account} address=${tokenAddress} on chain: ${chainId}`,
            );
        });
    });

    describe('different chain IDs', () => {
        it('should work with different chain IDs', async () => {
            const polygonChainId = 137;
            const mockBalance = {
                value: BigInt('1000000000000000000'),
                decimals: 18,
                symbol: 'MATIC',
            };
            mockGetBalance.mockResolvedValue(mockBalance);

            await getBalanceOf(polygonChainId, account, undefined);

            expect(mockGetBalance).toHaveBeenCalledWith(expect.any(Object), {
                chainId: polygonChainId,
                address: account,
                blockTag: 'latest',
            });
        });

        it('should pass chainId to multicall', async () => {
            const baseChainId = 8453;
            const balanceValue = BigInt('1000000');
            const decimals = 18n;
            const symbol = 'USDC';

            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: balanceValue },
                { status: 'success', result: decimals },
                { status: 'success', result: symbol },
            ]);

            await getBalanceOf(baseChainId, account, tokenAddress);

            expect(mockMulticall).toHaveBeenCalledWith(expect.any(Object), {
                contracts: expect.any(Array),
                chainId: baseChainId,
            });
        });
    });

    describe('edge cases', () => {
        it('should handle empty string address as falsy (calls getBalance)', async () => {
            const mockBalance = {
                value: BigInt('1000000000000000000'),
                decimals: 18,
                symbol: 'ETH',
            };
            mockGetBalance.mockResolvedValue(mockBalance);

            const result = await getBalanceOf(chainId, account, '');

            // Empty string is falsy, so !address is true and isZeroAddress is never called
            expect(mockIsZeroAddress).not.toHaveBeenCalled();
            expect(mockGetBalance).toHaveBeenCalledWith(expect.any(Object), {
                chainId,
                address: account,
                blockTag: 'latest',
            });
            expect(result).toEqual(mockBalance);
        });

        it('should handle very large balance values', async () => {
            const largeBalance = BigInt('999999999999999999999999999999999999999999');
            const decimals = 18n;
            const symbol = 'TEST';

            mockIsZeroAddress.mockReturnValue(false);
            mockMulticall.mockResolvedValue([
                { status: 'success', result: largeBalance },
                { status: 'success', result: decimals },
                { status: 'success', result: symbol },
            ]);

            const result = await getBalanceOf(chainId, account, tokenAddress);

            expect(result.value).toEqual(largeBalance);
        });
    });
});
