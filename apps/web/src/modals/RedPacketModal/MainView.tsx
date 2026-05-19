'use client';

import QuestionIcon from '@dimensiondev/assets/question.svg';
import RedPacketIcon from '@dimensiondev/assets/red-packet.svg';
import { NetworkType } from '@dimensiondev/enums';
import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import { rpSupportedChains } from '@dimensiondev/web3/chains';
import type { EthereumSchemaType } from '@dimensiondev/web3/enums';
import {
    isGreaterThan,
    isLessThan,
    isZero,
    leftShift,
    multipliedBy,
    rightShift,
    ZERO,
} from '@dimensiondev/web3/numbers';
import { getTokenAbiForWagmi } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { BigNumber } from 'bignumber.js';
import { isUndefined, omit } from 'lodash-es';
import { type ChangeEvent, useCallback, useContext, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { getChainId, switchChain, writeContract } from 'wagmi/actions';

import { ChainGuardButton } from '@/components/ChainGuardButton.js';
import { FungibleTokenInput } from '@/components/FungibleTokenInput.js';
import { useDefaultCreateGas } from '@/components/RedPacket/hooks/useDefaultCreateGas.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { TokenValue } from '@/components/TokenValue.js';
import { Tooltip } from '@/components/Tooltip.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { RED_PACKET_CONTRACT_VERSION, RED_PACKET_DURATION, RED_PACKET_MIN_SHARES } from '@/constants/rp.js';
import { createAccount } from '@/helpers/createAccount.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { getRpMaxShares, getRpMessageMaxLength } from '@/helpers/getRpLimitations.js';
import { isPrivyAddress } from '@/helpers/isPrivyAddress.js';
import { useAvailableBalance } from '@/hooks/useAvailableBalance.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { useERC20TokenAllowance } from '@/hooks/useERC20Allowance.js';
import { useNativeTokenPrice } from '@/hooks/useNativeTokenPrice.js';
import { RedPacketContext, redPacketRandomTabs } from '@/modals/RedPacketModal/RedPacketContext.js';
import { TypeTabs } from '@/modals/RedPacketModal/TypeTabs.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { checkFreeGasEligibility } from '@/providers/firefly/freeGas/checkFreeGasEligibility.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';

export default function MainView() {
    const { history } = useRouter();

    const {
        message,
        setMessage,
        randomType,
        setRandomType,
        shares,
        setShares,
        token,
        setToken,
        rawAmount,
        setRawAmount,
        networkType,
    } = useContext(RedPacketContext);

    const { chainId: contextChainId, account } = useChainContext({ networkType });
    const chainId = token?.chainId || contextChainId;
    const { data: nativeTokenPrice = 0, isLoading: priceLoading } = useNativeTokenPrice({ chainId, networkType });

    const isRandom = randomType === 'random';

    const { account: publicKey } = useMemo(createAccount, []);
    const { data: defaultGas = ZERO, isLoading: gasLoading } = useDefaultCreateGas({
        networkType,
        creator: account,
        version: RED_PACKET_CONTRACT_VERSION,
        chainId,
        publicKey,
        duration: RED_PACKET_DURATION,
        isRandom,
        name: 'Unknown User',
        message: message || t`Hope this sparks a smile.`,
        shares: shares || 0,
        token: token
            ? (omit(token, ['logoURI']) as FungibleToken<number, EthereumSchemaType.ERC20 | EthereumSchemaType.Native>)
            : undefined,
        total: rightShift(0.0001, token.decimals).toFixed(),
    });

    const balanceResult = useAvailableBalance(token.address as Address, defaultGas.toNumber(), {
        chainId,
        networkType,
    });
    const { gasFee, value: balance = ZERO, origin: originBalance, insufficientGas } = balanceResult || {};

    const amount = rightShift(rawAmount || '0', token?.decimals);
    const rawTotalAmount = isRandom || !rawAmount ? rawAmount : multipliedBy(rawAmount, shares).toFixed();
    const totalAmount = multipliedBy(amount, isRandom ? 1 : shares);
    const minTotalAmount = new BigNumber(isRandom ? 1 : shares);
    const isDivisible = !totalAmount.dividedBy(shares).isLessThan(1);
    const isEVM = networkType === NetworkType.Ethereum;

    const onTokenChange = useCallback(
        (token: FungibleToken<number, EthereumSchemaType>) => {
            setToken(token);
            setRawAmount('');
        },
        [setRawAmount, setToken],
    );

    const maxShares = getRpMaxShares(networkType);
    const onShareChange = useCallback(
        (ev: ChangeEvent<HTMLInputElement>) => {
            const inputShares = ev.currentTarget.value.replaceAll(/[,.]/g, '');
            if (inputShares === '') setShares(0);
            else if (/^[1-9]+\d*$/.test(inputShares)) {
                const parsed = Number.parseInt(inputShares, 10);
                if (parsed >= RED_PACKET_MIN_SHARES && parsed <= maxShares) {
                    setShares(Number.parseInt(inputShares, 10));
                } else if (parsed > maxShares) {
                    setShares(maxShares);
                }
            }
        },
        [maxShares, setShares],
    );

    const {
        data: allowance,
        isLoading: allowanceLoading,
        refetch: refetchAllowance,
    } = useERC20TokenAllowance(
        token.address as Address,
        isEVM ? getRedPacketContractAddress(chainId) : '',
        {
            chainId,
            networkType,
        },
        isEVM,
    );

    const nativeToken = getNativeToken(networkType, chainId);
    const cost = gasFee ? leftShift(gasFee, nativeToken.decimals).multipliedBy(nativeTokenPrice) : ZERO;

    // #region validation
    const noShares = shares === 0;
    const isGteMaxShares = shares > maxShares;
    const insufficientBalance =
        isGreaterThan(minTotalAmount, balance.toString()) || isGreaterThan(totalAmount, balance.toString());
    const noAmount = isZero(amount);
    const isNotEnoughAllowance = !isUndefined(allowance) && !isGreaterThan(allowance.toString(), totalAmount);
    const isUnsupportedChain =
        networkType === NetworkType.Ethereum ? rpSupportedChains.every((chain) => chain.id !== +chainId) : false;
    const freeGasAction = isNotEnoughAllowance
        ? { txType: 'token_approve' as const, to: token.address as string }
        : { txType: 'redpacket_send' as const, to: isEVM ? getRedPacketContractAddress(chainId) : '' };
    const shouldCheckFreeGasEligibility = isEVM && insufficientGas && !!account && isPrivyAddress(account);
    const { data: canUseFreeGasForCurrentStep = false, isLoading: isCheckingFreeGasEligibility } = useQuery({
        queryKey: [
            'red-packet-free-gas-eligibility',
            chainId,
            account?.toLowerCase(),
            freeGasAction.txType,
            freeGasAction.to,
        ],
        enabled: shouldCheckFreeGasEligibility,
        retry: 0,
        queryFn: async () => {
            const result = await checkFreeGasEligibility({
                chainId,
                txType: freeGasAction.txType,
                to: freeGasAction.to,
            });
            return result;
        },
    });
    const hasSufficientGasForCurrentStep = !insufficientGas || canUseFreeGasForCurrentStep;

    const disabled =
        noShares ||
        isGteMaxShares ||
        insufficientBalance ||
        noAmount ||
        !isDivisible ||
        !hasSufficientGasForCurrentStep ||
        isUnsupportedChain;
    const loading = priceLoading || gasLoading || allowanceLoading || isCheckingFreeGasEligibility;
    // #endregion

    // #region button
    const buttonText = useMemo(() => {
        if (isUnsupportedChain) return <Trans>Unsupported Chain</Trans>;
        if (noShares) return <Trans>Enter Number of Winners</Trans>;
        if (isGteMaxShares) return <Trans>At most {getRpMaxShares(networkType)} recipients</Trans>;
        if (insufficientBalance) return <Trans>Insufficient Balance</Trans>;
        if (noAmount) {
            return isRandom ? <Trans>Enter Total Amount</Trans> : <Trans>Enter Amount Each</Trans>;
        }

        if (!isDivisible)
            return (
                <Trans>
                    The minimum amount for each share is {formatBalance(1, token.decimals)} {token.symbol}
                </Trans>
            );

        if (!hasSufficientGasForCurrentStep) return <Trans>Insufficient Balance for Gas Fee</Trans>;

        if (isNotEnoughAllowance) {
            return (
                <span className="flex items-center gap-x-2">
                    <Trans>Unlock {token.symbol}</Trans>
                    <Tooltip
                        content={
                            <Trans>
                                Grant access to your {token.symbol} for the Lucky Drop Smart contract. You only have to
                                do this once per token.
                            </Trans>
                        }
                        placement="top"
                    >
                        <QuestionIcon width={18} height={18} />
                    </Tooltip>
                </span>
            );
        }

        return <Trans>Next</Trans>;
    }, [
        noShares,
        isGteMaxShares,
        insufficientBalance,
        noAmount,
        isDivisible,
        hasSufficientGasForCurrentStep,
        token.decimals,
        token.symbol,
        isNotEnoughAllowance,
        isRandom,
        networkType,
        isUnsupportedChain,
    ]);

    const [{ loading: interactionLoading }, handleClick] = useAsyncFn(async () => {
        const globalChainId = getChainId(wagmiConfig);
        if (!originBalance || isZero(originBalance.value.toString())) return;

        if (isEVM && globalChainId !== chainId) {
            await switchChain(wagmiConfig, { chainId });
        }

        if (isEVM && isNotEnoughAllowance) {
            const txHash = await writeContract(wagmiConfig, {
                chainId,
                abi: getTokenAbiForWagmi(chainId, token.address as Address),
                address: token.address as Address,
                functionName: 'approve',
                args: [getRedPacketContractAddress(chainId), originBalance.value],
            });
            await waitForEthereumTransaction(wagmiConfig, chainId, txHash);
            refetchAllowance();
            return;
        }

        history.push('/requirements');
    }, [originBalance, chainId, isNotEnoughAllowance, history, token.address, isEVM, refetchAllowance]);
    // #endregion

    const messageMaxLength = getRpMessageMaxLength(networkType);
    const onMessageChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setMessage(value.slice(0, messageMaxLength));
        },
        [messageMaxLength, setMessage],
    );

    return (
        <>
            <div className="bg-primaryBottom flex flex-1 flex-col gap-y-4 px-4 pt-2">
                <div className="flex gap-2">
                    <Tabs value={randomType} onChange={setRandomType} variant="solid" className="self-start">
                        {redPacketRandomTabs.map((tab) => (
                            <Tab value={tab.value} key={tab.value}>
                                {tab.label}
                            </Tab>
                        ))}
                    </Tabs>
                    <TypeTabs />
                </div>

                <div className="bg-bg focus-within:border-highlight focus-within:bg-primaryBottom flex items-center rounded-xl border border-transparent pr-3 focus-within:bg-bottom">
                    <form className="w-full flex-1">
                        <label className="flex w-full flex-1 items-center">
                            <input
                                value={shares || ''}
                                onChange={onShareChange}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                                placeholder={t`Enter number of winners`}
                                className={
                                    'placeholder:text-secondary w-full border-0 bg-transparent py-2 focus:border-0 focus:outline-0 focus:ring-0'
                                }
                                inputMode="decimal"
                                pattern="^[0-9]+$"
                            />
                        </label>
                    </form>
                    <span className="text-secondary mr-1 text-[14px] leading-[18px]">
                        <Trans>Winners</Trans>
                    </span>
                    <RedPacketIcon width={18} height={18} />
                </div>

                <FungibleTokenInput
                    amount={rawAmount}
                    maxAmount={
                        minTotalAmount.isGreaterThan(balance.toString()) && !isZero(balance.toString())
                            ? minTotalAmount.toString()
                            : undefined
                    }
                    token={token}
                    onTokenChange={onTokenChange}
                    onAmountChange={setRawAmount}
                    balance={balance.toString()}
                    networkType={networkType}
                    account={account}
                    maxAmountShares={isRandom || shares === 0 ? 1 : shares}
                    placeholder={randomType === 'equal' ? t`Enter the amount that each winner can claim` : undefined}
                />

                <label className="self-start text-[14px] font-bold leading-[18px]">
                    <Trans>Message</Trans>
                </label>

                <div className="bg-bg focus-within:border-highlight focus-within:bg-primaryBottom flex items-center rounded-xl border border-transparent pr-3 focus-within:bg-bottom">
                    <form className="w-full flex-1">
                        <label className="flex w-full flex-1 items-center">
                            <input
                                value={message}
                                onChange={onMessageChange}
                                placeholder={t`Hope this sparks a smile.`}
                                className="placeholder:text-secondary w-full border-0 bg-transparent py-2 focus:border-0 focus:outline-0 focus:ring-0"
                            />
                        </label>
                    </form>
                </div>

                {gasFee && !isZero(gasFee) ? (
                    <div className="flex justify-between">
                        <label className="text-[14px] font-bold leading-[18px]">
                            {networkType === NetworkType.Ethereum ? (
                                <Trans>Network cost</Trans>
                            ) : (
                                <Trans>Estimated network fee</Trans>
                            )}
                        </label>
                        <div className="text-secondary flex gap-x-1 text-[14px] font-bold leading-[18px]">
                            <span>
                                {formatBalance(gasFee, nativeToken.decimals)} {nativeToken.symbol}
                            </span>
                            <span>≈</span>
                            <span>{isLessThan(cost, 0.01) ? '< $0.01' : `$${cost.toFixed(2)}`}</span>
                        </div>
                    </div>
                ) : null}

                {rawTotalAmount && !isZero(rawTotalAmount) ? (
                    <TokenValue token={token} amount={rawTotalAmount} chainId={chainId} networkType={networkType} />
                ) : null}
            </div>
            <div className="grow" />
            <div className="bg-lightBottom80 shadow-primary dark:shadow-primaryDark w-full p-4 backdrop-blur-lg">
                <ChainGuardButton
                    networkType={networkType}
                    targetChainId={chainId}
                    className="rounded-lg"
                    disabled={disabled}
                    loading={loading || interactionLoading}
                    onClick={handleClick}
                >
                    {buttonText}
                </ChainGuardButton>
            </div>
        </>
    );
}
