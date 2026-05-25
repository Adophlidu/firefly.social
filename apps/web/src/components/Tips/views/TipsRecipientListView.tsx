'use client';

import SmallFireflyAvatar from '@dimensiondev/assets/small-firefly.svg';
import WarnIcon from '@dimensiondev/assets/warning-circle.svg';
import { WalletProfileDataSource } from '@dimensiondev/enums';
import { formatAddress, isSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';

import { ClickableButton } from '@/components/ClickableButton.js';
import { AddressLink } from '@/components/Tips/AddressLink.js';
import { RecipientAvatar } from '@/components/Tips/RecipientAvatar.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { captureTipsSwitchWalletEvent } from '@/providers/telemetry/captureTipsEvent.js';
import type { FireflyTipsProfile, WalletProfile } from '@/providers/types/Firefly.js';
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
                <div className="flex items-center gap-3 rounded-2xl border border-warn p-3 text-warn">
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
                                className="flex w-full cursor-pointer items-center gap-x-3 rounded-lg px-3 py-2 text-main hover:bg-lightBg"
                                onClick={() => handleSelectRecipient(recipient)}
                            >
                                <RecipientAvatar recipient={recipient} />
                                <div className="min-w-0 flex-1">
                                    {!recipient.ens ? (
                                        <div className="break-all text-left text-medium font-medium text-main">
                                            {recipient.address}
                                            {recipient.isDefault ? (
                                                <span className="ml-1 inline-flex h-4 -translate-y-0.5 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                                    <Trans>Primary</Trans>
                                                </span>
                                            ) : null}
                                            {isFireflyWallet ? (
                                                <span className="ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                                    <SmallFireflyAvatar width={13} height={13} />
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-medium font-bold text-main">{recipient.ens}</span>
                                            <div className="flex items-center">
                                                <span className="text-[13px] text-second">
                                                    {formatAddress(recipient.address, 4)}
                                                </span>
                                                {recipient.isDefault ? (
                                                    <span className="ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                                        <Trans>Primary</Trans>
                                                    </span>
                                                ) : null}
                                                {isFireflyWallet ? (
                                                    <span className="ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
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
