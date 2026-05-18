import { Source } from '@dimensiondev/enums';
import LeftArrowIcon from '@dimensiondev/assets/left-arrow.svg';
import type { NetworkType } from '@dimensiondev/web3/enums';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation, useRouter } from '@tanstack/react-router';
import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { BaseNotFound } from '@/components/BaseNotFound.js';
import { Loading } from '@/components/Loading.js';
import { FireflyTag } from '@/components/SendTransactionModal/FireflyTag.js';
import {
    isSocialRecipient,
    RecipientItem,
    type RecipientItemProps,
} from '@/components/SendTransactionModal/RecipientItem.js';
import { type FormValues, RoutePath } from '@/components/SendTransactionModal/types.js';
import type { ProfilePageSource } from '@/constants/enum.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { filterAndSortWalletProfiles, isFireflyVerified } from '@/helpers/sortWalletProfiles.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/getAllPlatformProfileFromFirefly.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

export function ChooseRecipientView() {
    const { setValue, control } = useFormContext<FormValues>();
    const token = useWatch({ control, name: 'token' });
    const { state } = useLocation();
    const recipient = (state as unknown as { recipient: RecipientItemProps }).recipient;
    const router = useRouter();
    if (!state || !isSocialRecipient(recipient)) {
        return <Navigate to={RoutePath.Form} />;
    }
    return (
        <div className="flex w-full flex-col px-6 pb-6">
            <div className="relative flex items-center justify-center py-6">
                <button
                    className="text-main absolute left-0 top-6 cursor-pointer rounded p-1"
                    onClick={() => {
                        router.navigate({ to: RoutePath.Form, replace: true });
                    }}
                >
                    <LeftArrowIcon className="size-6" />
                </button>
                <h2 className="text-main text-lg font-semibold">
                    <Trans>Recipient</Trans>
                </h2>
            </div>
            <ChooseRecipient
                recipient={recipient}
                networkType={token.networkType}
                onClick={(recipient) => {
                    setValue('recipient', recipient);
                    setValue('to', recipient.address);
                    router.navigate({ to: RoutePath.Form });
                }}
            />
        </div>
    );
}

function ChooseRecipient({
    recipient,
    onClick,
    networkType,
}: {
    recipient: RecipientItemProps;
    networkType: NetworkType;
    onClick: (recipient: RecipientItemProps) => void;
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['logged-in-firefly-profiles', recipient.source, recipient.id],
        queryFn: async () => {
            try {
                const relatedProfiles = await getAllPlatformProfileFromFirefly(
                    {
                        source: recipient.source as ProfilePageSource,
                        id: recipient.id!,
                    },
                    false,
                );
                return formatFireflyProfilesFromWalletProfiles(relatedProfiles) as FireflyProfile[];
            } catch {
                return null;
            }
        },
    });
    const recipients = React.useMemo(() => {
        if (!data) return null;

        const walletProfiles = data
            .filter(
                (item) =>
                    item.identity.source === Source.Wallet &&
                    (item.__origin__ as WalletProfile).blockchain === networkType,
            )
            .map((x) => x.__origin__ as WalletProfile);

        const sortedWallets = filterAndSortWalletProfiles(walletProfiles);

        return sortedWallets.map((walletProfile) => {
            const tags: React.ReactNode[] = [];
            if (walletProfile.isDefault) tags.push(t`Primary`);
            if (isFireflyVerified(walletProfile)) tags.push(<FireflyTag key="firefly" />);

            const ens = getEnsNameFromWalletProfile(walletProfile);
            return {
                ...recipient,
                address: walletProfile.address,
                ens,
                ...(ens ? { avatar: getStampAvatarByProfileId(Source.Wallet, ens) } : {}),
                tags: tags.length > 0 ? tags : undefined,
            };
        });
    }, [data, networkType, recipient]);

    if (isLoading) {
        return <Loading minHeight={370} />;
    }

    if (!recipients?.length) {
        return (
            <BaseNotFound className="!border-0">
                <div className="mt-11 text-sm font-bold">
                    <Trans>No wallet address found for this user.</Trans>
                </div>
            </BaseNotFound>
        );
    }

    return (
        <div className="mt-2 flex w-full flex-col space-y-2">
            {recipients.map((recipient) => (
                <div
                    role="button"
                    tabIndex={0}
                    key={`${recipient.address}`}
                    className="hover:bg-bg w-full cursor-pointer rounded-lg px-3 py-2"
                    onClick={() => onClick(recipient)}
                >
                    <RecipientItem {...recipient} explorerLink showSources forceAddress />
                </div>
            ))}
        </div>
    );
}
