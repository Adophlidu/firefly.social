import '../src/app/globals.css';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { UserListTippy } from '@/components/Notification/UserListTippy.jsx';
import { Source } from '@/constants/enum.js';
import { ProfileStatus } from '@/providers/types/SocialMedia.js';

const meta = {
    title: 'components/Notification/UserListTippy',
    component: UserListTippy,
    decorators: [
        (Story) => (
            <div style={{ padding: '10em 20em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof UserListTippy>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        old: true,
        open: false,
        users: [
            {
                displayName: 'John Doe',
                profileId: '12345',
                source: Source.Twitter,
                followerCount: 1000,
                handle: 'johndoe',
                followingCount: 500,
                fullHandle: '@johndoe',
                pfp: 'pfp',
                profileSource: Source.Twitter,
                status: ProfileStatus.Active,
                verified: true,
            },
        ],
        children: <span>A list of users</span>,
    },
};
export default meta;
