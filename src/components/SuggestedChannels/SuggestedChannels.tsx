import { SuggestedChannelsSkeleton } from '@/components/SuggestedChannels/SuggestedChannelsSkeleton.js';
import { dynamic } from '@/esm/dynamic.js';

const SuggestedChannelsCard = dynamic(() => import('./SuggestedChannelsCard.js').then((m) => m.SuggestedChannelsCard), {
    ssr: false,
    loading: () => <SuggestedChannelsSkeleton />,
});

export function SuggestedChannels() {
    return <SuggestedChannelsCard />;
}
