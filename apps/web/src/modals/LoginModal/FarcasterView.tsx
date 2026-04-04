import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useLocation } from '@tanstack/react-router';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { LoginFarcaster } from '@/components/Login/LoginFarcaster.js';
import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { FarcasterSignType } from '@/constants/enum.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { resolveFarcasterDefaultSignType } from '@/providers/farcaster/resolveFarcasterDefaultSignType.js';

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
    const isLoginFirefly = useIsLoginFirefly();
    const { data, isLoading } = useAllConnections({
        enabled: isLoginFirefly && !returnSignType,
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

    if (isLoading) {
        return (
            <div className="box-border flex flex-col rounded-xl p-6 pt-0 md:w-[500px]">
                <div className="flex min-h-[200px] flex-col items-center justify-center">
                    <LoadingIcon />
                </div>
            </div>
        );
    }
    return <LoginFarcaster key={`farcaster_${signType ?? 'unknown'}`} signType={signType} />;
}
