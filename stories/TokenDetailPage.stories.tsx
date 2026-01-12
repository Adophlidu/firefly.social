// cspell: disable
import { type Meta, type StoryObj } from '@storybook/nextjs-vite';
import { useMemo, useState } from 'react';

import { KolBar } from '@/components/TokenProfile/KolBar.js';
import { MentionedByModal } from '@/components/TokenProfile/MentionedByModal.js';
import { Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

const meta = {
    title: 'Token/TokenDetailPage',
    render: function Render({ users: allUsers }) {
        const [count, setCount] = useState(3);
        const [openModal, setOpenModal] = useState(false);
        const users = useMemo(() => allUsers.slice(0, count), [allUsers, count]);
        return (
            <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">KolBar</h2>
                <div>
                    <KolBar users={users} onClick={() => setOpenModal(true)} />
                </div>
                <div className="flex gap-2">
                    <button
                        className="size-8 rounded border border-gray-700 p-1"
                        onClick={() => setCount((v) => Math.max(0, v - 1))}
                    >
                        -
                    </button>
                    <span className="text-lg">{count}</span>
                    <button
                        className="size-8 rounded border border-gray-700 p-1"
                        onClick={() => setCount((v) => Math.min(allUsers.length, v + 1))}
                    >
                        +
                    </button>
                </div>
                {openModal && users.length ? (
                    <MentionedByModal open onClose={() => setOpenModal(false)} users={users} />
                ) : null}
            </div>
        );
    },
} satisfies Meta<{
    users: Profile[];
}>;

type Story = StoryObj<{
    users: Profile[];
}>;

export const KolBarStory: Story = {
    args: {
        users: [
            'vitalik.eth',
            'sujiyan.eth',
            'suji.eth',
            'apple.eth',
            'banana.eth',
            'cat.eth',
            'dog.eth',
            'elephant.eth',
            'fox.eth',
        ].map((handle) => {
            return {
                source: Source.Twitter,
                profileSource: Source.Twitter,
                profileId: handle,
                displayName: handle,
                status: ProfileStatus.Active,
                handle,
                verified: true,
                fullHandle: handle,
                pfp: `https://i.pravatar.cc/200?u=${handle}`,
                name: handle,
                followerCount: 0,
                followingCount: 0,
            };
        }) as Profile[],
    },
};

export default meta;
