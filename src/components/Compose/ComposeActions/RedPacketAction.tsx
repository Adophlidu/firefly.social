import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';
import { polygon } from 'viem/chains';
import { useChainId, useSwitchChain } from 'wagmi';

import RedPacketIcon from '@/assets/red-packet.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { CharTag, FileMimeType } from '@/constants/enum.js';
import { ENABLED_RP_SOURCES, LENS_CHAIN_ID, RP_HASH_TAG, SITE_URL, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { fetchImageAsPNG } from '@/helpers/fetchImageAsPNG.js';
import { getCompositePost } from '@/helpers/getCompositePost.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useSetEditorContent } from '@/hooks/useSetEditorContent.js';
import { RedPacketModalRef } from '@/modals/RedPacketModal/index.js';
import { captureRedPacketClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { Chars } from '@/types/chars.js';

interface RedPacketActionProps extends ClickableButtonProps {}

export const RedPacketAction = memo<RedPacketActionProps>(function RedPacketAction({ disabled = false }) {
    const { availableSources } = useCompositePost();
    const { ethereum, solana } = useWalletAccountAll();
    const chainId = useChainId();
    const { switchChainAsync } = useSwitchChain();
    const setEditorContent = useSetEditorContent();
    const profilesAll = useCurrentProfilesAll();
    const { cursor, updateChars, addImage, updateIsBusy } = useComposeStateStore();

    const promoteLink = useMemo(() => {
        const preferSource = SORTED_SOCIAL_SOURCES.find((x) => availableSources.includes(x) && profilesAll[x]);
        if (!preferSource) return SITE_URL;
        const preferProfile = profilesAll[preferSource]!;
        return urlcat(location.origin, getProfileUrl(preferProfile));
    }, [profilesAll, availableSources]);

    const [{ loading }, openRedPacketComposeDialog] = useAsyncFn(async () => {
        if (!ethereum.address && !solana.address) {
            ethereum.connect();
            return;
        }
        // rp does not support lens chain
        if (ethereum.address && chainId === LENS_CHAIN_ID) {
            await switchChainAsync({ chainId: polygon.id });
        }
        captureRedPacketClickEvent();

        const result = await RedPacketModalRef.openAndWaitForClose();
        if (result) {
            const compositePost = getCompositePost(cursor);
            const firstChar = compositePost?.chars[0];
            if (
                firstChar &&
                typeof firstChar !== 'string' &&
                'tag' in firstChar &&
                firstChar.tag === CharTag.FIREFLY_RP
            )
                return;

            updateIsBusy(true);
            const chars: Chars = [
                {
                    tag: CharTag.FIREFLY_RP,
                    content: RP_HASH_TAG,
                    visible: false,
                },
                ...(compositePost ? compositePost.chars : []),
                t`Check out my LuckyDrop 🧧💰✨ on Firefly mobile app or desktop!`,
                {
                    tag: CharTag.PROMOTE_LINK,
                    content: promoteLink,
                    visible: false,
                    sortNo: 5,
                },
            ];
            try {
                const coverBlob = await fetchImageAsPNG(result, true);
                updateChars(chars);
                setEditorContent(chars);
                addImage(
                    createLocalMediaObject(new File([coverBlob], 'image.png', { type: FileMimeType.PNG }), true),
                    0,
                );
            } finally {
                updateIsBusy(false);
            }
        }
    }, [
        ethereum,
        solana.address,
        chainId,
        switchChainAsync,
        promoteLink,
        setEditorContent,
        cursor,
        updateChars,
        addImage,
        updateIsBusy,
    ]);

    const invalidSources = availableSources.filter((x) => !ENABLED_RP_SOURCES.includes(x));
    const rpDisabled = disabled || !!invalidSources.length || !availableSources.length;

    const content = (
        <ClickableButton
            aria-disabled={rpDisabled}
            className={classNames('size-5', {
                'cursor-wait opacity-50': loading,
                'cursor-not-allowed opacity-50': !loading && rpDisabled,
                'cursor-pointer': !rpDisabled,
            })}
            onClick={() => {
                if (rpDisabled) return;
                openRedPacketComposeDialog();
            }}
        >
            <RedPacketIcon width={20} height={20} />
        </ClickableButton>
    );

    if (invalidSources.length) {
        return (
            <Tooltip
                placement="top"
                content={<Trans>Lucky drop for {resolveSourcesName(invalidSources)} is coming soon.</Trans>}
            >
                {content}
            </Tooltip>
        );
    }

    return content;
});
