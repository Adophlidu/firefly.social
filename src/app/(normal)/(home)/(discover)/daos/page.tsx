import { NoSSR } from '@/components/NoSSR.js';
import { DiscoverSnapshotList } from '@/components/Snapshot/DiscoverSnapshotList.js';

export default function DAOs() {
    return (
        <NoSSR>
            <DiscoverSnapshotList />
        </NoSSR>
    );
}
