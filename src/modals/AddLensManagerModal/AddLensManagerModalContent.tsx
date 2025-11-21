import { addAccountManager } from '@lens-protocol/client/actions';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { captureLensBindManagerEvent } from '@/providers/telemetry/captureLensEvent.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    manager: string;
    profile: Profile;
    onFinished?: (status: boolean) => void;
    onLoadingChange?: (loading: boolean) => void;
}

export const AddLensManagerModalContent = memo<Props>(function AddLensManagerModalContent({
    manager,
    profile,
    onFinished,
    onLoadingChange,
}) {
    const [{ loading }, bindManager] = useAsyncFn(async () => {
        try {
            onLoadingChange?.(true);

            // bind manager
            const txData = await ensureLensResult(
                addAccountManager(lensSessionHolder.sessionClient, {
                    address: safeEvmAddress(manager),
                    permissions: {
                        canSetMetadataUri: true,
                        canTransferNative: true,
                        canTransferTokens: true,
                        canExecuteTransactions: true,
                    },
                }),
            );
            await handleOperationWithLensChain(txData);

            // capture event
            captureLensBindManagerEvent(profile);

            onFinished?.(true);
        } catch (error) {
            onFinished?.(false);
            throw error;
        } finally {
            onLoadingChange?.(false);
        }
    }, [profile, manager, onFinished, onLoadingChange]);

    return (
        <div>
            <div className="flex w-full items-center gap-2 rounded-lg border border-lightLineSecond p-2">
                <ProfileAvatar profile={profile} size={40} enableSourceIcon={false} />
                <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-bold text-main">{profile.displayName}</p>
                    <p className="truncate text-sm text-second">@{profile.handle}</p>
                </div>
            </div>
            <p className="mt-2 py-1 text-center text-medium font-medium text-second">
                <Trans>Sign to grant Firefly permission for auto login</Trans>
            </p>
            <ClickableButton
                loading={loading}
                onClick={bindManager}
                className="mt-2 h-10 w-full rounded-lg bg-main text-medium font-bold leading-10 text-primaryBottom"
            >
                <Trans>Sign to Authorize</Trans>
            </ClickableButton>
        </div>
    );
});
