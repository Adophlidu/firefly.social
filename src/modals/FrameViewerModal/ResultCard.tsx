import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
    description?: React.ReactNode;
}

export function ResultCard({ description }: Props) {
    return (
        <div className="flex h-[232px] w-full items-center justify-center gap-2 px-4">
            <CheckCircleIcon width={24} height={24} className="text-success" />
            <p>{description}</p>
        </div>
    );
}
