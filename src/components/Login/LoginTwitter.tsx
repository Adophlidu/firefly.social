'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { signIn } from 'next-auth/react';
import { type HTMLProps } from 'react';
import { useEffectOnce } from 'react-use';
import urlcat from 'urlcat';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';

interface Props extends HTMLProps<HTMLDivElement> {}

export function LoginTwitter(props: Props) {
    const pathname = usePathname();

    useEffectOnce(() => {
        signIn('twitter', {
            redirect: false,
            callbackUrl:
                pathname !== PageRoute.Profile && isRoutePathname(pathname, PageRoute.Profile)
                    ? urlcat(location.origin, '/profile?source=twitter')
                    : undefined,
        });
    });

    return (
        <div
            {...props}
            className={classNames(
                'flex min-h-[200px] w-full flex-col items-center justify-center gap-4 md:w-[500px]',
                props.className,
            )}
        >
            <LoadingIcon />
            <div className="mt-2 text-center text-sm leading-[16px] text-second">
                <Trans>Please confirm the login with X.</Trans>
            </div>
        </div>
    );
}
