import { LoadingIcon } from '@/components/LoadingIcon.js';

export function LoadingIndicator() {
    return (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center text-darkBottom dark:text-lightBottom">
            <LoadingIcon />
        </div>
    );
}
