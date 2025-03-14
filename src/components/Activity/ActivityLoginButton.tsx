'use client';

import { Trans } from '@lingui/react/macro';

import AddIcon from '@/assets/plus.svg';
import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import { useIsLoginInActivity } from '@/components/Activity/hooks/useIsLoginInActivity.js';
import { useLoginInActivity } from '@/components/Activity/hooks/useLoginInActivity.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { useAsyncStatus, useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';

export function ActivityLoginButton({ source }: { source: SocialSource }) {
    const isLoggedIn = useIsLoginInActivity(source);
    const { isLoading: isLoadingActivityConnections } = useActivityConnections();
    const [{ loading }, login] = useLoginInActivity();
    const asyncStatus = useAsyncStatus(source);
    if (isLoggedIn) {
        return (
            <button className="flex h-8 items-center rounded-lg border border-current px-4 font-bold leading-8 text-[13x]">
                <Trans>Connected</Trans>
            </button>
        );
    }
    const isLoading = loading || asyncStatus || isLoadingActivityConnections;
    return (
        <button
            className="relative h-8 rounded-lg border border-current px-4 font-bold leading-8 text-[13x] disabled:opacity-60"
            disabled={isLoading}
            onClick={() => login(source)}
        >
            {isLoading ? (
                <span className="left-0 top-0 flex h-full w-full items-center justify-center">
                    <LoadingIcon size={16} />
                </span>
            ) : null}
            <span
                className={classNames('flex items-center', {
                    'opacity-0': isLoading,
                })}
            >
                <SocialSourceIcon size={18} className="mr-2 size-[18px] shrink-0" source={source} mono />
                <Trans>Sign in</Trans>
            </span>
        </button>
    );
}

export function ActivityLoginButtonWithMultipleSources({ sources }: { sources: SocialSource[] }) {
    const isLoggedIn = useIsLoginInActivity(sources);
    const { isLoading: isLoadingActivityConnections } = useActivityConnections();
    const [{ loading }, login] = useLoginInActivity();
    const asyncStatus = useAsyncStatusAll();
    if (isLoggedIn) {
        return (
            <button className="flex h-8 items-center rounded-lg border border-current px-4 font-bold leading-8 text-[13x]">
                <Trans>Connected</Trans>
            </button>
        );
    }
    const isLoading = loading || asyncStatus || isLoadingActivityConnections;
    return (
        <div className="flex space-x-1">
            {sources.map((source) => (
                <button
                    key={source}
                    className="relative h-8 rounded-lg border border-current px-4 font-bold leading-8 text-[13x] disabled:opacity-60"
                    disabled={isLoading}
                    onClick={() => login(source)}
                >
                    {isLoading ? (
                        <span className="left-0 top-0 flex h-full w-full items-center justify-center">
                            <LoadingIcon size={16} />
                        </span>
                    ) : null}
                    <span
                        className={classNames('flex items-center', {
                            'opacity-0': isLoading,
                        })}
                    >
                        <AddIcon width={18} height={18} className="size-[18px] shrink-0" />
                        <SocialSourceIcon size={18} className="size-[18px] shrink-0" source={source} mono />
                    </span>
                </button>
            ))}
        </div>
    );
}
