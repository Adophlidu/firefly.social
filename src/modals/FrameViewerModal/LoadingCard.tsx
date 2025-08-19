import { LoadingIcon } from '@/components/LoadingIcon.js';

interface Props {
    description?: React.ReactNode;
}

export function LoadingCard({ description }: Props) {
    return (
        <div className="flex h-[232px] w-full items-center justify-center gap-2 px-4">
            <LoadingIcon />
            <p>{description}</p>
        </div>
    );
}
