import { NoSSR } from '@/components/NoSSR.js';
import { FollowingSnapshotList } from '@/components/Snapshot/FollowingSnapshotList.js';

export default function DAOs() {
    return (
        <NoSSR>
            <FollowingSnapshotList />
        </NoSSR>
    );
}
