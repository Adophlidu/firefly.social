import { isSameAddress, isValidAddressEthereum } from '@dimensiondev/web3-utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';
import { type Address, erc20Abi } from 'viem';
import { useAccount } from 'wagmi';
import { readContracts } from 'wagmi/actions';

import { ActionButton } from '@/components/ActionButton.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
} from '@/components/DialogOrDrawer.js';
import { Input } from '@/components/ui/input.js';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select.js';
import { visibleChains } from '@/configs/chains.js';
import { config } from '@/configs/wagmi.js';
import { EthereumChainId } from '@/constants/ethereum.js';
import { useMultiChainTokens } from '@/hooks/useMultiChainTokens.js';
import { searchTokenLogoURI } from '@/queries/firefly/searchTokenLogoURI.js';
import { addCustomTokenAtom, CustomTokenType } from '@/store/customToken.js';

export interface AddCustomERC20ModalProps {
    open: boolean;
    onClose: () => void;
    initialChainId?: number;
}

interface FormValues {
    chainId: number;
    contractAddress: string;
}

const chains = visibleChains;

function AddCustomERC20ModalContent({
    onClose,
    initialChainId = EthereumChainId.Mainnet,
}: {
    onClose: () => void;
    initialChainId?: number;
}) {
    const account = useAccount();
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { isValid },
    } = useForm<FormValues>({
        defaultValues: {
            chainId: initialChainId,
            contractAddress: '',
        },
        mode: 'onChange',
    });

    const selectedChain = watch('chainId');
    const contractAddress = watch('contractAddress');

    const chainIds = chains.map((x) => x.id);
    const selectedChainConfig = useMemo(() => {
        return chains.find((chain) => chain.id === selectedChain);
    }, [selectedChain]);

    const { data: tokensData, isLoading } = useMultiChainTokens();
    const tokens = useMemo(() => {
        return (
            tokensData?.tokenAssets?.map((token) => ({
                id: token.tokenAddress,
                chainId: Number(token.chainIndex),
            })) ?? []
        );
    }, [tokensData]);
    const addToken = useSetAtom(addCustomTokenAtom);
    const [{ loading }, onAdd] = useAsyncFn(
        async (values: FormValues) => {
            try {
                if (!account.address) return;
                const address = values.contractAddress as Address;
                if (tokens.some((x) => isSameAddress(x.id, address))) {
                    onClose?.();
                    return;
                }
                const erc20Contracts = {
                    chainId: values.chainId as (typeof chains)[number]['id'],
                    abi: erc20Abi,
                    address,
                };
                const result = await readContracts(config, {
                    contracts: [
                        {
                            ...erc20Contracts,
                            functionName: 'decimals',
                        },
                        {
                            ...erc20Contracts,
                            functionName: 'name',
                        },
                        {
                            ...erc20Contracts,
                            functionName: 'symbol',
                        },
                    ],
                });
                const [decimals, name, symbol] = result.map((x) => x.result) as [number, string, string];
                if (!decimals || !name || !symbol) {
                    toast.error(<Trans>Failed to fetch token info</Trans>);
                    return;
                }
                const logoURI = await searchTokenLogoURI({
                    name,
                    symbol,
                    address,
                });
                addToken({
                    type: CustomTokenType.ERC20,
                    logoURI: logoURI || '',
                    chainId: values.chainId,
                    address,
                    name,
                    symbol,
                    decimals,
                });
                toast.success(<Trans>Token added</Trans>);
                onClose?.();
            } catch (error) {
                toast.error(<Trans>Failed to add token</Trans>, {
                    description: (error instanceof Error ? error.message : String(error)).split('\n')[0],
                });
            }
        },
        [account.address, tokens, addToken, onClose],
    );

    const disabledAdd =
        !isValid || !isValidAddressEthereum(contractAddress) || !account.address || !contractAddress || !selectedChain;

    return (
        <form onSubmit={handleSubmit(onAdd)} className="w-full">
            <div className="mb-6 flex w-full flex-col">
                <div className="flex items-center gap-2.5">
                    <Select
                        value={String(selectedChain)}
                        onValueChange={(value) => setValue('chainId', Number.parseInt(value, 10))}
                    >
                        <SelectTrigger className="border-lightLineSecond text-main h-10 w-[120px] shrink-0 items-center gap-1 rounded-lg border px-2 text-xs">
                            {selectedChainConfig ? (
                                <div className="flex min-w-0 items-center gap-2">
                                    <ChainIcon chainId={selectedChain} size={15} />
                                    <span className="truncate">{selectedChainConfig.name}</span>
                                </div>
                            ) : (
                                <span>{selectedChain}</span>
                            )}
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            side="bottom"
                            align="start"
                            className="bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom z-50 max-h-[275px] w-[200px] overflow-y-auto rounded-lg py-3 md:max-h-[370px] dark:border dark:shadow-none"
                            viewPortClassName="py-1"
                        >
                            {chainIds.map((chainId) => {
                                const chain = chains.find((c) => c.id === chainId);
                                return (
                                    <SelectItem key={chainId} value={String(chainId)} className="hover:bg-lightBg">
                                        <div className="flex items-center gap-2">
                                            {chain ? (
                                                <>
                                                    <ChainIcon chainId={chainId} size={15} />
                                                    <span className="text-main text-xs">{chain.name}</span>
                                                </>
                                            ) : (
                                                <span className="text-main text-xs">{chainId}</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    <div className="bg-lightBg focus-within:border-highlight flex-1 rounded-lg border border-transparent transition-all">
                        <Input
                            {...register('contractAddress', {
                                required: true,
                                validate: (value) => isValidAddressEthereum(value) || 'Invalid address',
                            })}
                            autoComplete="off"
                            placeholder={t`Contract address`}
                            className="placeholder:text-secondary h-10 rounded-lg border-0 bg-transparent px-3 py-1.5 text-sm focus:border-0 focus:outline-0 focus-visible:ring-0"
                        />
                    </div>
                </div>
            </div>
            <ActionButton disabled={disabledAdd} loading={loading || isLoading} type="submit" className="h-10">
                <Trans>Add</Trans>
            </ActionButton>
        </form>
    );
}

export function AddCustomERC20Modal({
    open,
    onClose,
    initialChainId = EthereumChainId.Mainnet,
}: AddCustomERC20ModalProps) {
    return (
        <DialogOrDrawer
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onClose?.();
                }
            }}
        >
            <DialogOrDrawerContent>
                <DialogOrDrawerHeader>
                    <DialogOrDrawerTitle>
                        <Trans>Add Token</Trans>
                    </DialogOrDrawerTitle>
                </DialogOrDrawerHeader>
                <AddCustomERC20ModalContent onClose={onClose} initialChainId={initialChainId} />
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    );
}
