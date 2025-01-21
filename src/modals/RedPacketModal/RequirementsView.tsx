import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { getEnumAsArray } from '@masknet/kit';
import { useAppKitAccount } from '@reown/appkit/react';
import { useRouter } from '@tanstack/react-router';
import { Fragment, useCallback, useContext } from 'react';

import ArrowDown from '@/assets/arrow-down.svg';
import InfoIcon from '@/assets/info.svg';
import MinusIcon from '@/assets/minus.svg';
import { ActionButton } from '@/components/ActionButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { NetworkType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatDebankTokenToFungibleToken } from '@/helpers/formatToken.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import {
    NonFungibleTokenCollectionSelectModalRef,
    TokenSelectorModalRef,
} from '@/modals/controls.js';
import { REQUIREMENT_ICON_MAP, REQUIREMENT_TITLE_MAP } from '@/modals/RedPacketModal/common.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { RequirementType } from '@/providers/types/FireflyRedPacket.js';

export function RequirementsView() {
    const { history } = useRouter();
    const {
        rules,
        setRules,
        requireCollections,
        setRequireCollections,
        requireTokens,
        setRequireTokens,
        requireChannel,
        setRequireChannel,
        requireClub,
        setRequireClub,
        token,
    } = useContext(RedPacketContext);

    const disabled = rules.includes(RequirementType.NFTHolder) && !requireCollections;

    const handleSelectCollection = useCallback(async () => {
        const result = await NonFungibleTokenCollectionSelectModalRef.openAndWaitForClose({
            selected: requireCollections,
            initialAddTokenChainId: token.chainId,
        });
        if (!result) return;
        setRequireCollections((collections) => [...collections, result]);
    }, [requireCollections, setRequireCollections, token.chainId]);

    const account = useAppKitAccount();
    const selectToken = async () => {
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
        if (picked) {
            setRequireTokens((tokens) => [...tokens, { token: picked, quantity: '' }]);
        }
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
                                        if (!event.currentTarget.checked && value === RequirementType.NFTHolder) {
                                            setRequireCollections(EMPTY_LIST);
                                        }

                                        setRules(
                                            event.currentTarget.checked
                                                ? [...rules, value]
                                                : rules.filter((x) => x !== value),
                                        );
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
                                                className="flex max-w-full gap-2 rounded-lg bg-input p-3 text-second"
                                            >
                                                <MinusIcon
                                                    className="h-6 w-6 shrink-0 text-main"
                                                    onClick={() => {
                                                        setRequireCollections((collections) =>
                                                            collections.filter((x) => x !== collection),
                                                        );
                                                    }}
                                                />
                                                <div className="flex min-w-0 flex-grow items-center gap-2">
                                                    <TokenIcon
                                                        chainId={collection.chainId}
                                                        icon={collection.iconURL!}
                                                        name={collection.name}
                                                        size={24}
                                                        disableBadge
                                                        className="h-6 w-6 rounded-full"
                                                    />
                                                    {collection.name ? (
                                                        <div className="min-w-0 flex-grow truncate text-left text-medium leading-5 text-main">
                                                            {collection.name}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                {collection.iconURL ? null : (
                                                    <div className="items-center text-second">
                                                        <Trans>Select token to gate access</Trans>
                                                    </div>
                                                )}
                                                <ArrowDown className="h-6 w-6" />
                                            </div>
                                        ))}
                                        {requireCollections.length < 3 ? (
                                            <div
                                                className="flex cursor-pointer justify-between gap-2 rounded-lg bg-input p-3 text-second"
                                                onClick={handleSelectCollection}
                                            >
                                                <div className="items-center text-second">
                                                    <Trans>Select NFT collection to gate access</Trans>
                                                </div>
                                                <ArrowDown className="ml-auto h-6 w-6" />
                                            </div>
                                        ) : null}
                                    </div>
                                </Fragment>
                            );
                        }
                        if (value === RequirementType.TokenHolder) {
                            return (
                                <Fragment key={value}>
                                    {item}
                                    <div className="mx-3 flex flex-col gap-2">
                                        {requireTokens.map(({ token, quantity }) => (
                                            <div className="flex gap-2" key={`${token.chainId}-${token.address}`}>
                                                <div className="flex flex-grow gap-2 rounded-lg bg-input p-3 text-second">
                                                    <MinusIcon
                                                        className="h-6 w-6 shrink-0 cursor-pointer text-main"
                                                        onClick={() => {
                                                            setRequireTokens((tokens) =>
                                                                tokens.filter((t) => t.token !== token),
                                                            );
                                                        }}
                                                    />
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <TokenIcon
                                                            size={24}
                                                            networkType={NetworkType.Ethereum}
                                                            chainId={token.chainId}
                                                            icon={token.logoURL}
                                                            name={token.name}
                                                            className="h-6 w-6 rounded-full"
                                                        />
                                                        {token.name ? (
                                                            <div className="flex-grow truncate text-medium leading-5 text-main">
                                                                {token.name}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <ArrowDown className="ml-auto h-6 w-6" />
                                                </div>
                                                <input
                                                    className="w-[200px] shrink-0 rounded-lg border-0 bg-input p-3 text-second outline-0 focus:ring-0"
                                                    type="number"
                                                    placeholder={t`Minimum token amount`}
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        setRequireTokens((tokens) =>
                                                            tokens.map((t) => {
                                                                if (t.token === token) {
                                                                    return { ...t, quantity: e.target.value };
                                                                }
                                                                return t;
                                                            }),
                                                        );
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        {requireTokens.length < 3 ? (
                                            <div
                                                className="flex cursor-pointer justify-between rounded-lg bg-input p-3 text-second"
                                                onClick={selectToken}
                                            >
                                                <div className="items-center gap-y-2 text-second">
                                                    <Trans>Select token to gate access</Trans>
                                                </div>
                                                <ArrowDown className="ml-auto h-6 w-6" />
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
