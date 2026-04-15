import { isNativeTokenAddress } from '@dimensiondev/web3-utils';
import { type Address, erc20Abi, type Hex } from 'viem';
import { readContract, sendTransaction } from 'wagmi/actions';

import type { ChainId } from '@/configs/chains.js';
import { config } from '@/configs/wagmi.js';
import { rightShift } from '@/helpers/number.js';
import { estimateSwapGas } from '@/helpers/swap/estimateSwapGas.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import type { SwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import type { SwapToken } from '@/providers/swap/types.js';

interface ExecuteEvmApprovalParams {
    endpoint: SwapEndpoint;
    fromToken: SwapToken;
    fromAmount: string;
    chainId: ChainId;
    walletAddress: string;
    routerAddress: string;
    connector: (typeof config.connectors)[number];
}

export async function executeEvmApproval(params: ExecuteEvmApprovalParams): Promise<void> {
    const { endpoint, fromToken, fromAmount, chainId, walletAddress, routerAddress, connector } = params;
    const amountInSmallest = rightShift(fromAmount, fromToken.decimals).toFixed(0);
    const approveTxData = await endpoint.getApproveTransaction({
        tokenAddress: fromToken.address,
        amount: amountInSmallest,
        chainId,
        userWalletAddress: walletAddress,
        spender: routerAddress,
    });
    const spenderAddress = approveTxData?.dexContractAddress ?? routerAddress;

    const needsApproval =
        !isNativeTokenAddress(fromToken.address) && fromToken.address && walletAddress && spenderAddress;
    if (!needsApproval) return;

    // Check allowance on-chain
    const allowance = await readContract(config, {
        chainId,
        address: fromToken.address as Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletAddress as Address, spenderAddress as Address],
    });

    const allowanceBigInt = allowance as bigint;
    const amountBigInt = BigInt(amountInSmallest);

    if (allowanceBigInt >= amountBigInt) return;

    if (!approveTxData) return;

    const approveTo = fromToken.address as Address;
    const approveData = approveTxData.data as Hex;
    const approveValue = BigInt(0);
    const approveGasLimit = approveTxData.gasLimit
        ? BigInt(approveTxData.gasLimit)
        : await estimateSwapGas({
              chainId,
              to: approveTo,
              data: approveData,
              value: approveValue,
              account: walletAddress as Address,
          });

    const approveHash = await sendTransaction(config, {
        chainId,
        connector,
        account: walletAddress as Address,
        to: approveTo,
        data: approveData,
        value: approveValue,
        gas: approveGasLimit,
        ...(approveTxData.gasPrice ? { gasPrice: BigInt(approveTxData.gasPrice) } : {}),
    });

    await waitForEthereumTransaction(chainId, approveHash);
}
