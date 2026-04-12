import { useRouter } from '@tanstack/react-router';
import { memo, useCallback } from 'react';
import { useAsync } from 'react-use';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SearchTokenPanel } from '@/components/Search/SearchTokenPanel.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { resolveNetworkProvider } from '@/helpers/resolveTokenTransfer.js';
import type { Token } from '@/providers/types/Transfer.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export const TokenSelectorView = memo(function TokenSelectorView() {
    const router = useRouter();
    const { recipient, token: selectedToken, update } = useTipsStore();

    const { value: address, loading } = useAsync(async () => {
        if (!recipient) return;
        const network = resolveNetworkProvider(recipient?.networkType);
        return network.getAccount();
    }, [recipient]);

    const onTokenSelected = useCallback(
        (token: Token) => {
            update({ token });
            router.navigate({ to: TipsRoutePath.TIPS, replace: true });
        },
        [router, update],
    );

    const isSelected = useCallback((item: Token) => item.id === selectedToken?.id, [selectedToken]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center md:h-[526px]">
                <LoadingIcon />
            </div>
        );
    }

    return (
        <>
            {address && recipient?.networkType ? (
                <div className="h-full">
                    <SearchTokenPanel
                        networkType={recipient.networkType}
                        address={address}
                        onSelected={onTokenSelected}
                        isSelected={isSelected}
                    />
                </div>
            ) : null}
        </>
    );
});
