import { LoadingIcon } from '@/components/LoadingIcon.js';

export function TipsModalContentSkeleton() {
    return (
        <div className="flex h-[358px] items-center justify-center md:h-[368px]">
            <LoadingIcon size={24} />
        </div>
    );
}
