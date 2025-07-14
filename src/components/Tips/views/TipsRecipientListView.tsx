import { Trans } from '@lingui/react/macro';

import WarnIcon from '@/assets/warning-circle.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { AddressLink } from '@/components/Tips/AddressLink.js';
import { RecipientAvatar } from '@/components/Tips/RecipientAvatar.js';
import { router, TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { TipsContext, type TipsProfile } from '@/hooks/useTipsContext.js';

export function TipsRecipientListView() {
    const { recipientList, recipient: selectedRecipient, update } = TipsContext.useContainer();

    const handleSelectRecipient = (recipient: TipsProfile) => {
        if (!isSameAddress(recipient.address, selectedRecipient?.address)) {
            update((prev) => ({ ...prev, recipient }));
        }

        router.navigate({ to: TipsRoutePath.TIPS, replace: true });
    };

    return (
        <>
            <div className="flex h-[262px] flex-col md:h-[272px]">
                <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto">
                    {recipientList.map((recipient) => {
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
                <div className="mt-4 flex shrink-0 items-center gap-3 rounded-2xl border border-warn p-3 text-warn">
                    <WarnIcon width={24} height={24} className="shrink-0" />
                    <p className="text-left text-[13px] font-medium leading-5">
                        <Trans>
                            Please note that the wallet address related to social account may be inaccurate or subject
                            to change. Be sure to verify the address before sending.
                        </Trans>
                    </p>
                </div>
            </div>
        </>
    );
}
