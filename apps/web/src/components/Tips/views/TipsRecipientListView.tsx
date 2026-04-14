'use client';

import SmallFireflyAvatar from '@dimensiondev/assets/small-firefly.svg';
import WarnIcon from '@dimensiondev/assets/warning-circle.svg';
import { isSameAddress } from '@dimensiondev/web3-utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';

import { ClickableButton } from '@/components/ClickableButton.js';
import { AddressLink } from '@/components/Tips/AddressLink.js';
import { RecipientAvatar } from '@/components/Tips/RecipientAvatar.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { captureTipsSwitchWalletEvent } from '@/providers/telemetry/captureTipsEvent.js';
import { type FireflyTipsProfile, type WalletProfile, WalletProfileDataSource } from '@/providers/types/Firefly.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export function TipsRecipientListView() {
    const router = useRouter();
    const { recipientList, recipient: selectedRecipient, identity, update } = useTipsStore();

    const handleSelectRecipient = (recipient: FireflyTipsProfile) => {
        if (!isSameAddress(recipient.address, selectedRecipient?.address)) {
            if (selectedRecipient?.networkType !== recipient.networkType) {
                update({ recipient, token: null });
            } else {
                update({ recipient });
            }
            captureTipsSwitchWalletEvent(identity, recipient.address);
        }

        router.navigate({ to: TipsRoutePath.TIPS, replace: true });
    };

    return (
        <>
            <div className="no-scrollbar h-full overflow-y-auto">
                <div className="border-warn text-warn flex items-center gap-3 rounded-2xl border p-3">
                    <WarnIcon width={24} height={24} className="shrink-0" />
                    <p className="text-left text-[13px] font-medium leading-5">
                        <Trans>Associated wallet may be outdated or inaccurate. Please verify before sending.</Trans>
                    </p>
                </div>
                <div className="mt-4 space-y-2">
                    {recipientList.map((recipient) => {
                        const isFireflyWallet =
                            (recipient.__origin__ as WalletProfile | null)?.dataSource ===
                            WalletProfileDataSource.Privy;

                        return (
                            <ClickableButton
                                key={recipient.address}
                                className="text-main hover:bg-lightBg flex w-full cursor-pointer items-center gap-x-3 rounded-lg px-3 py-2"
                                onClick={() => handleSelectRecipient(recipient)}
                            >
                                <RecipientAvatar recipient={recipient} />
                                <div className="min-w-0 flex-1">
                                    {!recipient.ens ? (
                                        <div className="text-medium text-main break-all text-left font-medium">
                                            {recipient.address}
                                            {recipient.isDefault ? (
                                                <span className="text-highlight ml-1 inline-flex h-4 -translate-y-0.5 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                                    <Trans>Primary</Trans>
                                                </span>
                                            ) : null}
                                            {isFireflyWallet ? (
                                                <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                                    <SmallFireflyAvatar width={13} height={13} />
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-medium text-main font-bold">{recipient.ens}</span>
                                            <div className="flex items-center">
                                                <span className="text-second text-[13px]">
                                                    {formatAddress(recipient.address, 4)}
                                                </span>
                                                {recipient.isDefault ? (
                                                    <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                                        <Trans>Primary</Trans>
                                                    </span>
                                                ) : null}
                                                {isFireflyWallet ? (
                                                    <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                                        <SmallFireflyAvatar width={13} height={13} />
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <AddressLink
                                    size={20}
                                    address={recipient.address}
                                    networkType={recipient.networkType}
                                />
                            </ClickableButton>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
