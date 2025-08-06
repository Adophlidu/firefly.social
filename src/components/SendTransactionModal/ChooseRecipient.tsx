import { useQuery } from '@tanstack/react-query';

import { Loading } from '@/components/Loading.js';
import { RecipientItem, type RecipientItemProps } from '@/components/SendTransactionModal/RecipientItem.js';
import { NetworkType, type ProfilePageSource, Source } from '@/constants/enum.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/getAllPlatformProfileFromFirefly.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

export function ChooseRecipient({
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
    const recipients = data
        ?.filter(
            (item) =>
                item.identity.source === Source.Wallet && (item.__origin__ as WalletProfile).blockchain === networkType,
        )
        .map((x) => ({
            ...recipient,
            address: (x.__origin__ as WalletProfile).address,
        }));

    if (isLoading) {
        return <Loading minHeight={370} />;
    }

    return (
        <div className="mt-2 flex w-full flex-1 flex-col space-y-2 overflow-y-auto">
            {recipients?.map((recipient) => (
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
