'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAsyncFn } from 'react-use';

import StarFilledIcon from '@/assets/star-filled.svg';
import StarOutlineIcon from '@/assets/star-outline.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import type { DefaultConnectionPlatform } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function PrimaryButton({
    platform,
    isDefault,
    platformId,
    tooltipContent,
}: {
    platform: DefaultConnectionPlatform;
    platformId: string;
    isDefault?: boolean;
    tooltipContent: ReactNode;
}) {
    const queryClient = useQueryClient();
    const [{ loading }, onSetPrimary] = useAsyncFn(async () => {
        await FireflyEndpointProvider.updateDefaultConnection(platformId, platform);
        await queryClient.refetchQueries({ queryKey: ['my-wallet-connections'] });
    }, [platformId, platform, queryClient]);

    return (
        <Tooltip content={tooltipContent} placement="top">
            <ClickableButton
                className={classNames('h-5 w-5 shrink-0', {
                    'cursor-pointer': !isDefault,
                })}
                disabled={loading}
                onClick={() => {
                    if (isDefault) return;
                    onSetPrimary();
                }}
            >
                {loading ? (
                    <LoadingIcon size={20} />
                ) : isDefault ? (
                    <StarFilledIcon width={20} height={20} className="shrink-0 text-warn" />
                ) : (
                    <StarOutlineIcon width={20} height={20} className="shrink-0 text-second" />
                )}
            </ClickableButton>
        </Tooltip>
    );
}
