import { FarcasterSignType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useLocation } from '@tanstack/react-router';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { dynamic } from '@/esm/dynamic.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { resolveFarcasterDefaultSignType } from '@/providers/farcaster/resolveFarcasterDefaultSignType.js';

function FarcasterViewLoading() {
    return (
        <div className="box-border flex flex-col rounded-xl p-6 pt-0 md:w-[500px]">
            <div className="flex min-h-[200px] flex-col items-center justify-center">
                <LoadingIcon />
            </div>
        </div>
    );
}

// Deferred so @wagmi/core is not pulled into the login-modal chunk on whiteboard
// first paint; loads when the Farcaster login view actually renders. The loading
// placeholder keeps the modal height stable while the chunk loads (otherwise the
// content collapses to zero height and then pops in).
const LoginFarcaster = dynamic(() => import('@/components/Login/LoginFarcaster.js').then((m) => m.LoginFarcaster), {
    ssr: false,
    loading: () => <FarcasterViewLoading />,
});

export const FarcasterViewBeforeLoad = () => {
    return {
        title: <Title />,
    };
};

function useSignType() {
    const { signType, expectedSignType } = useLocation().search as {
        signType: FarcasterSignType | null;
        expectedSignType?: FarcasterSignType;
    };
    const returnSignType = signType || expectedSignType;
    const isLogin = useIsLoginFirefly();
    const { data, isLoading } = useAllConnections({
        enabled: isLogin && !returnSignType,
    });
    const defaultSignType = !IS_MOBILE_DEVICE
        ? resolveFarcasterDefaultSignType(data?.social.Farcaster.connected.length)
        : null;

    return {
        signType: returnSignType || defaultSignType,
        isLoading,
    };
}

function Title() {
    const { signType, isLoading } = useSignType();
    if (!signType || isLoading) return null;

    switch (signType) {
        case FarcasterSignType.GrantPermission:
        case FarcasterSignType.FireflySponsorship:
            return <Trans>New connection via Farcaster</Trans>;
        case FarcasterSignType.RelayService:
            return <Trans>Sign in with Farcaster</Trans>;
        case FarcasterSignType.RecoveryPhrase:
            return <Trans>Sign in with recovery phrase</Trans>;
        default:
            safeUnreachable(signType);
            return null;
    }
}

export function FarcasterView() {
    const { signType, isLoading } = useSignType();

    if (isLoading) return <FarcasterViewLoading />;

    return <LoginFarcaster key={`farcaster_${signType ?? 'unknown'}`} signType={signType} />;
}
