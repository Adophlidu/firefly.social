'use client';
import { BookmarkedTokens } from '@/components/Token/BookmarkedTokens.js';
import { SideTrendingTokens } from '@/components/Token/SideTrendingTokens.js';

export default function Page() {
    return (
        <div className="mt-4 flex flex-col gap-6">
            <BookmarkedTokens />
            <SideTrendingTokens />
        </div>
    );
}
