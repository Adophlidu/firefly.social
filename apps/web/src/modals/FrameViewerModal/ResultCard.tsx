import { CheckCircleIcon } from '@heroicons/react/24/outline';

import { ChainIcon } from '@/components/ChainIcon.js';

interface Props {
    description?: React.ReactNode;
    chainId?: number;
}

export function ResultCard({ description, chainId }: Props) {
    return (
        <div className="flex h-[232px] w-full flex-col items-center justify-center gap-3 px-4">
            <div className="flex items-center gap-2">
                <CheckCircleIcon width={24} height={24} className="text-success" />
                {chainId !== undefined ? <ChainIcon chainId={chainId} size={20} className="shrink-0" /> : null}
            </div>
            {description ? <p className="text-center">{description}</p> : null}
        </div>
    );
}
