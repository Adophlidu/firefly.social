import { Trans } from '@lingui/react/macro';
import { getEnumAsArray } from '@masknet/kit';
import { type FungibleToken } from '@masknet/web3-shared-base';
import { useAppKitAccount } from '@reown/appkit/react';
import { useRouter } from '@tanstack/react-router';
import { Fragment, useCallback, useContext, useState } from 'react';

import AddIcon from '@/assets/add.svg';
import ArrowDown from '@/assets/arrow-down.svg';
import InfoIcon from '@/assets/info.svg';
import MinusIcon from '@/assets/minus.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatDebankTokenToFungibleToken } from '@/helpers/formatToken.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { NonFungibleTokenCollectionSelectModalRef, TokenSelectorModalRef } from '@/modals/controls.js';
import type { Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import { REQUIREMENT_ICON_MAP, REQUIREMENT_TITLE_MAP } from '@/modals/RedPacketModal/common.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { RequirementType } from '@/providers/types/FireflyRedPacket.js';

export function RequirementsView() {
    const { history } = useRouter();
    const { rules, setRules, requireCollections, setRequireCollections, requireTokens, setRequireTokens, token } =
        useContext(RedPacketContext);
    const [collectionSlots, setCollectionSlots] = useState<number[]>(() => {
        return requireCollections.length ? [] : [Date.now()];
    });
    const [tokenSlots, setTokenSlots] = useState<number[]>(() => {
        return requireTokens.length ? [] : [Date.now()];
    });

    const disabled =
        rules.includes(RequirementType.NFTHolder) && (!requireCollections.length || !!collectionSlots.length);

    const handleSelectCollection = useCallback(
        async (slot: number, previous?: Collection) => {
            const picked = await NonFungibleTokenCollectionSelectModalRef.openAndWaitForClose({
                selected: requireCollections,
                initialAddTokenChainId: token.chainId,
            });
            if (!picked) return;
            if (previous) {
                setRequireCollections((collections) => collections.map((x) => (x === previous ? picked : x)));
            } else {
                setRequireCollections((collections) => [...collections, picked]);
            }
            setCollectionSlots((slots) => slots.filter((s) => s !== slot));
        },
        [requireCollections, setRequireCollections, token.chainId],
    );

    const account = useAppKitAccount();
    const selectToken = async (slot: number, previous?: FungibleToken<number, number>) => {
        if (!account.address) return;
        const picked = await TokenSelectorModalRef.openAndWaitForClose({
            address: account.address,
            disableBackdropClose: true,
            networkType: NetworkType.Ethereum,
            isSelected: (item) => {
                const token = formatDebankTokenToFungibleToken(item);
                return requireTokens.some(({ token: t }) => {
                    return isSameEthereumAddress(t.address, token.address) && t.chainId === item.chainId;
                });
            },
        });
        if (!picked) return;
        if (previous) {
            setRequireTokens((tokens) =>
                tokens.map((x) => (x.token === previous ? { ...x, token: picked, quantity: '' } : x)),
            );
        } else {
            setRequireTokens((tokens) => [...tokens, { token: picked, quantity: '' }]);
        }
        setTokenSlots((slots) => slots.filter((s) => s !== slot));
    };

    return (
        <>
            <div className="flex flex-1 flex-col gap-y-4 bg-primaryBottom px-4 py-2">
                <div className="flex gap-x-[6px] rounded-[4px] bg-bg p-3">
                    <InfoIcon width={20} height={20} />
                    <div className="flex flex-col gap-[10px] text-start text-[13px] leading-[18px]">
                        <div>
                            <Trans>You can set one or multiple rules to be eligible to win a Lucky Drop.</Trans>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex max-w-[568px] flex-col gap-2">
                    {getEnumAsArray(RequirementType).map(({ value }) => {
                        const checked = rules.includes(value);
                        const Icon = REQUIREMENT_ICON_MAP[value];
                        const title = REQUIREMENT_TITLE_MAP[value];

                        const item = (
                            <div className="flex items-center gap-x-2 px-3 py-1" key={value}>
                                <Icon width={20} height={20} />
                                <div className="flex-1 text-start font-bold">{title}</div>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    className="h-5 w-5 cursor-pointer rounded-[4px] text-highlight"
                                    onChange={(event) => {
                                        const checked = event.currentTarget.checked;
                                        setRules(checked ? [...rules, value] : rules.filter((x) => x !== value));
                                        if (!checked) return;
                                        if (value === RequirementType.NFTHolder) {
                                            setRequireCollections(EMPTY_LIST);
                                            setCollectionSlots([Date.now()]);
                                        }
                                    }}
                                />
                            </div>
                        );
                        if (!checked) return item;
                        if (value === RequirementType.NFTHolder) {
                            return (
                                <Fragment key={value}>
                                    {item}
                                    <div className="mx-3 flex flex-col gap-2">
                                        {requireCollections.map((collection) => (
                                            <div
                                                key={`${collection.chainId}-${collection.address}`}
                                                className="flex max-w-full gap-2 rounded-lg bg-input p-3 text-second dark:bg-bg"
                                            >
                                                <MinusIcon
                                                    className="h-6 w-6 shrink-0 text-main"
                                                    onClick={() => {
                                                        const list = requireCollections.filter((x) => x !== collection);
                                                        setRequireCollections(list);
                                                        if (list.length === 0 && collectionSlots.length === 0) {
                                                            setRules((rules) => rules.filter((x) => x !== value));
                                                        }
                                                    }}
                                                />
                                                <div className="flex min-w-0 flex-grow items-center gap-2">
                                                    <TokenIcon
                                                        chainId={collection.chainId}
                                                        icon={collection.iconURL!}
                                                        name={collection.name}
                                                        size={24}
                                                        disableBadge
                                                        className="h-6 w-6 shrink-0 rounded-full"
                                                    />
                                                    {collection.name ? (
                                                        <div className="min-w-0 flex-grow truncate text-left text-medium leading-5 text-main">
                                                            {collection.name}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <ArrowDown
                                                    className="h-6 w-6 cursor-pointer"
                                                    onClick={() => handleSelectCollection(0, collection)}
                                                />
                                            </div>
                                        ))}
                                        {collectionSlots.map((slot) => (
                                            <div
                                                key={slot}
                                                className="flex cursor-pointer justify-between gap-2 rounded-lg bg-input p-3 text-second dark:bg-bg"
                                                onClick={() => handleSelectCollection(slot)}
                                            >
                                                <MinusIcon
                                                    className="h-6 w-6 shrink-0 text-main"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const list = collectionSlots.filter((x) => x !== slot);
                                                        setCollectionSlots(list);
                                                        if (list.length === 0 && requireCollections.length === 0) {
                                                            setRules((rules) => rules.filter((x) => x !== value));
                                                        }
                                                    }}
                                                />
                                                <div className="items-center text-second">
                                                    <Trans>Select NFT collection to gate access</Trans>
                                                </div>
                                                <ArrowDown className="ml-auto h-6 w-6" />
                                            </div>
                                        ))}
                                        {requireCollections.length + collectionSlots.length < 3 ? (
                                            <div
                                                className="flex cursor-pointer items-center justify-end gap-2 text-base text-main"
                                                onClick={() => {
                                                    setCollectionSlots((slots) => [...slots, Date.now()]);
                                                }}
                                            >
                                                <AddIcon className="h-5 w-5" />
                                                <Trans>Add another NFT gate</Trans>
                                            </div>
                                        ) : null}
                                    </div>
                                </Fragment>
                            );
                        }

                        return item;
                    })}
                </div>

                <div className="flex justify-end">
                    <div
                        className="cursor-pointer text-base font-bold leading-[20px] text-highlight"
                        onClick={() => {
                            setRules(EMPTY_LIST);
                            setRequireTokens(EMPTY_LIST);
                            setRequireCollections(EMPTY_LIST);
                            setTokenSlots(EMPTY_LIST);
                            setCollectionSlots(EMPTY_LIST);
                        }}
                    >
                        <Trans>Clear all requirements</Trans>
                    </div>
                </div>
            </div>
            <div className="flex-grow" />
            <div className="w-full bg-lightBottom80 p-4 shadow-primary backdrop-blur-lg dark:shadow-primaryDark">
                <ActionButton
                    className="rounded-lg"
                    disabled={disabled}
                    onClick={() => {
                        history.push('/confirm');
                    }}
                >
                    <Trans>Next</Trans>
                </ActionButton>
            </div>
        </>
    );
}
