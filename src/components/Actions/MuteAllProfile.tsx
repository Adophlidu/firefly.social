import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import MuteIcon from '@/assets/mute.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Source } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { ConfirmModalRef } from '@/modals/controls.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { captureMuteEvent } from '@/providers/telemetry/captureMuteEvent.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface MuteAllProfileBaseProps extends HTMLProps<'button'> {
    identity: FireflyIdentity;
    handleOrEnsOrAddress: string;
    blocking?: boolean;
    onClose?(): void;
}

function waitForConfirmation() {
    return ConfirmModalRef.openAndWaitForClose({
        title: t`Mute all`,
        content: (
            <p className="text-lightMain">
                <Trans>All posts and activities from this user will be hidden from you</Trans>
            </p>
        ),
        variant: 'normal',
    });
}

function MuteAllProfileBase({ identity, onClose, className }: MuteAllProfileBaseProps) {
    const isLogin = useIsLogin();
    const [{ loading }, handleMuteAll] = useAsyncFn(async () => {
        try {
            onClose?.();
            const confirmed = await waitForConfirmation();
            if (!confirmed) return;
            const source = identity.source;
            if (!isProfilePageSource(source)) return;
            const isMutedAll = await FireflyEndpointProvider.isProfileMutedAll(source, identity.id);
            if (!isMutedAll) await FireflyEndpointProvider.muteProfileAll(identity);
            enqueueSuccessMessage(t`All wallets and accounts are muted.`);
            captureMuteEvent(EventId.MUTE_ALL_SUCCESS, identity);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to mute all wallets and accounts.`);
            throw error;
        }
    }, [identity, onClose]);

    if (!isLogin) return null;

    return (
        <MenuButton onClick={handleMuteAll} disabled={loading} className={className}>
            {loading ? <LoadingIcon size={18} /> : <MuteIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">
                <Trans>Mute all</Trans>
            </span>
        </MenuButton>
    );
}

export const MuteAllByProfile = memo<{
    profile: Profile;
    onClose: MuteAllProfileBaseProps['onClose'];
    className?: MuteAllProfileBaseProps['className'];
}>(function MuteAllByProfile({ profile, onClose, className }) {
    const identity = useFireflyIdentity(profile.source, profile.profileId);
    return (
        <MuteAllProfileBase
            identity={identity}
            handleOrEnsOrAddress={`@${profile.handle}`}
            blocking={profile.viewerContext?.blocking}
            onClose={onClose}
            className={className}
        />
    );
});

export const MuteAllByWallet = memo<{
    address: Address;
    handle?: string;
    onClose: MuteAllProfileBaseProps['onClose'];
    className?: MuteAllProfileBaseProps['className'];
}>(function MuteAllByWallet({ address, handle, onClose, className }) {
    const identity = useFireflyIdentity(Source.Wallet, address);
    const { data: ens } = useEnsName({ address });

    return (
        <MuteAllProfileBase
            identity={identity}
            handleOrEnsOrAddress={handle?.replace('@', '') || ens || formatAddress(address, 4)}
            onClose={onClose}
            className={className}
        />
    );
});
