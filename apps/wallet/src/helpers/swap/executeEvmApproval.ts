import { estimateSwapGas, waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import type { ChainId } from '@dimensiondev/web3/chains';
import { rightShift } from '@dimensiondev/web3/numbers';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { type Address, erc20Abi, type Hex } from 'viem';
import { readContract, sendTransaction } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { logger } from '@/lib/Logger.js';
import type { SwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';

interface ExecuteEvmApprovalParams {
    endpoint: SwapEndpoint;
    fromToken: SwapToken;
    fromAmount: string;
    chainId: number;
    walletAddress: string;
    routerAddress: string;
    connector: (typeof config.connectors)[number];
    isCrossChain?: boolean;
    toChainId?: number;
    toTokenAddress?: string;
    slippage?: string;
    recipientAddress?: string;
}

export async function executeEvmApproval(params: ExecuteEvmApprovalParams): Promise<void> {
    const {
        endpoint,
        fromToken,
        fromAmount,
        chainId,
        walletAddress,
        routerAddress,
        connector,
        isCrossChain,
        toChainId,
        toTokenAddress,
        slippage,
        recipientAddress,
    } = params;
    const amountInSmallest = rightShift(fromAmount, fromToken.decimals).toFixed(0);

    let approveTxData;
    let spenderAddress: string;

    if (isCrossChain) {
        approveTxData = await endpoint.getCrossChainApproveTransaction({
            fromTokenAddress: fromToken.address,
            toTokenAddress: toTokenAddress!,
            amount: fromAmount,
            fromChainId: chainId,
            toChainId: toChainId!,
            fromDecimals: fromToken.decimals,
            slippage,
            userWalletAddress: walletAddress,
            recipientWalletAddress: recipientAddress,
        });
        spenderAddress = approveTxData?.dexContractAddress ?? '';
    } else {
        approveTxData = await endpoint.getApproveTransaction({
            tokenAddress: fromToken.address,
            amount: amountInSmallest,
            chainId,
            userWalletAddress: walletAddress,
            spender: routerAddress,
        });
        spenderAddress = approveTxData?.dexContractAddress ?? routerAddress;
    }

    const needsApproval =
        !isNativeTokenAddress(fromToken.address) && fromToken.address && walletAddress && spenderAddress;
    if (!needsApproval) return;

    // Check allowance on-chain
    const allowance = await readContract(config, {
        chainId: chainId as ChainId,
        address: fromToken.address as Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletAddress as Address, spenderAddress as Address],
    });

    const allowanceBigInt = allowance as bigint;
    const amountBigInt = BigInt(amountInSmallest);
    logger.info('Checking token allowance', {
        token: fromToken.symbol,
        allowance: allowanceBigInt.toString(),
        amount: amountBigInt.toString(),
    });

    if (allowanceBigInt >= amountBigInt) return;

    if (!approveTxData) return;

    const approveTo = fromToken.address as Address;
    const approveData = approveTxData.data as Hex;
    const approveValue = BigInt(0);
    const approveGasLimit = approveTxData.gasLimit
        ? BigInt(approveTxData.gasLimit)
        : await estimateSwapGas(config, {
              chainId,
              to: approveTo,
              data: approveData,
              value: approveValue,
              account: walletAddress as Address,
          });

    // Try free gas for approve (stablecoins only)
    const freeGasResult = await tryFreeGasTransaction({
        chainId,
        txType: FreeGasTxType.TokenApprove,
        from: walletAddress as Address,
        to: approveTo,
        data: approveData,
        tokenAddress: fromToken.address,
    });

    let approveHash: Hex;
    if (freeGasResult.type === 'free-gas') {
        approveHash = freeGasResult.hash as Hex;
    } else {
        approveHash = await sendTransaction(config, {
            chainId: chainId as ChainId,
            connector,
            account: walletAddress as Address,
            to: approveTo,
            data: approveData,
            value: approveValue,
            gas: approveGasLimit,
            ...(approveTxData.gasPrice ? { gasPrice: BigInt(approveTxData.gasPrice) } : {}),
        });
    }

    await waitForEthereumTransaction(config, chainId, approveHash);
}
