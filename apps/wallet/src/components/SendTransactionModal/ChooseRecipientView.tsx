import type { NetworkType, ProfilePageSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@dimensiondev/ssr';
import * as React from 'react';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { BaseNotFound } from '@/components/BaseNotFound.js';
import { Loading } from '@/components/Loading.js';
import { Navigate } from '@/components/Navigate.js';
import { NavigationBar } from '@/components/NavigationBar.js';
import { FireflyTag } from '@/components/SendTransactionModal/FireflyTag.js';
import {
    isSocialRecipient,
    RecipientItem,
    type RecipientItemProps,
} from '@/components/SendTransactionModal/RecipientItem.js';
import { type FormValues, RoutePath } from '@/components/SendTransactionModal/types.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { getNavigationState } from '@/helpers/navigationState.js';
import { filterAndSortWalletProfiles, isFireflyVerified } from '@/helpers/sortWalletProfiles.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/getAllPlatformProfileFromFirefly.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

export function ChooseRecipientView() {
    const { setValue, control } = useFormContext<FormValues>();
    const token = useWatch({ control, name: 'token' });
    const { pathname } = useRouterState();
    const state = getNavigationState<{ recipient?: RecipientItemProps }>(pathname);
    const recipient = state?.recipient;
    const navigate = useNavigate();

    useEffect(() => {
        if (!recipient) return;
        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_SEND_RECIPIENT_CHANGE_WALLET_CLICK, {
            target_firefly_account_id: recipient.fireflyId ?? undefined,
            target_social_handle: recipient.handle ?? undefined,
        });
    }, [recipient, recipient?.fireflyId, recipient?.handle]);

    if (!state || !recipient || !isSocialRecipient(recipient)) {
        return <Navigate to={RoutePath.Form} />;
    }
    return (
        <div className="flex w-full flex-col gap-2 pb-6">
            <NavigationBar onBack={() => navigate(RoutePath.Form, { replace: true })}>
                <Trans>Recipient</Trans>
            </NavigationBar>
            <div className="px-4">
                <ChooseRecipient
                    recipient={recipient}
                    networkType={token.networkType}
                    onClick={(chosenRecipient) => {
                        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_SEND_RECIPIENT_SELECT, {
                            chain_id: token.chainId,
                            recipient_type: 'social_user',
                            target_firefly_account_id: chosenRecipient.fireflyId ?? undefined,
                            target_social_handle: chosenRecipient.handle ?? undefined,
                            target_wallet_address: chosenRecipient.address,
                            target_ens: chosenRecipient.ens ?? undefined,
                        });
                        captureWalletTelemetryEvent(WalletTelemetryEventId.WALLET_SEND_RECIPIENT_WALLET_CHANGE, {
                            target_firefly_account_id: chosenRecipient.fireflyId ?? undefined,
                            target_social_handle: chosenRecipient.handle ?? undefined,
                            target_wallet_address: chosenRecipient.address,
                        });
                        setValue('recipient', chosenRecipient);
                        setValue('to', chosenRecipient.address);
                        navigate(RoutePath.Form);
                    }}
                />
            </div>
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
                    className="w-full cursor-pointer rounded-lg px-3 py-2 hover:bg-bg"
                    onClick={() => onClick(recipient)}
                >
                    <RecipientItem {...recipient} explorerLink showSources forceAddress />
                </div>
            ))}
        </div>
    );
}
