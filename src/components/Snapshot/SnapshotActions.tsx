import { memo, useCallback } from 'react';
import { useEnsName } from 'wagmi';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { ShareAction } from '@/components/Actions/ShareAction.js';
import { Tips } from '@/components/Tips/index.js';
import { Source } from '@/constants/enum.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useToggleSnapshotBookmark } from '@/hooks/useToggleSnapshotBookmark.js';
import { type SnapshotActivity } from '@/providers/snapshot/type.js';

interface SnapshotActionsProps {
    activity: SnapshotActivity;
    link: string;
}

export const SnapshotActions = memo<SnapshotActionsProps>(function SnapshotActions({ link, activity }) {
    const { mutate: onBookmarkChange, isPending: bookmarkMutationLoading } = useToggleSnapshotBookmark();
    const author = activity?.author;
    const identity = useFireflyIdentity(Source.Wallet, author.id);

    const { data: ens } = useEnsName({ address: author.id });

    const handleBookmark = useCallback(() => {
        onBookmarkChange(activity);
    }, [onBookmarkChange, activity]);

    return (
        <div className="flex items-center justify-end gap-2">
            {activity ? (
                <Bookmark
                    hiddenCount
                    hasBookmarked={activity?.hasBookmarked}
                    loading={bookmarkMutationLoading}
                    onClick={handleBookmark}
                />
            ) : null}
            <Tips identity={identity} handle={ens} onClick={close} pureWallet />
            <ShareAction link={link} />
        </div>
    );
});
