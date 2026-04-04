import { memo } from 'react';

import { dynamic } from '@/esm/dynamic.js';

const HlsPlayer = dynamic(() => import('@/components/HlsPlayer/index.js').then((m) => m.HlsPlayer), { ssr: false });

interface VideoPosterProps {
    src: string;
}

export const VideoPoster = memo<VideoPosterProps>(function VideoPoster({ src }) {
    return (
        <div className="flex size-[120px] items-center rounded-xl">
            <HlsPlayer className="w-full" src={src} />
        </div>
    );
});
