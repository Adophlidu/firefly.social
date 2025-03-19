import { ClickableButton } from '@/components/ClickableButton.js';
import { LoginModalRef, TipsModalRef } from '@/modals/controls.js';
import TipsIcon from '@/assets/tips.svg';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useAsyncFn } from 'react-use';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';
import { Source } from '@/constants/enum.js';
import { enqueueInfoMessage } from '@/helpers/enqueueMessage.js';
import { t } from '@lingui/core/macro';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';

interface Props {
    identity: FireflyIdentity;
    handle?: string | null;
    profiles?: FireflyProfile[];
}

export function TipsButton({ identity, handle, profiles }: Props) {
    const isLogin = useIsLoginFirefly();
    const [{ loading }, handleClick] = useAsyncFn(async () => {
        try {
            if (!isLogin) {
                LoginModalRef.open({ source: narrowToSocialSource(identity.source) });
                return;
            }
            if (!profiles?.some((profile) => profile.identity.source === Source.Wallet)) {
                throw new Error('No available profiles');
            }
            TipsModalRef.open({
                identity,
                handle: handle ?? null,
                profiles,
            });
        } catch (error) {
            enqueueInfoMessage(t`Sorry, we are not able to find a wallet for ${handle ? '@' + handle : identity.id}.`);
            throw error;
        }
    }, []);
    return (
        <ClickableButton
            className="inline-flex size-8 items-center justify-center rounded-lg bg-lightBg text-second active:opacity-50 md:hover:opacity-60"
            loading={loading}
            onClick={handleClick}
        >
            <TipsIcon />
        </ClickableButton>
    );
}
