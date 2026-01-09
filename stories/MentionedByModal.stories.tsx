import { type Meta, type StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { MentionedByModal } from '@/components/TokenProfile/MentionedByModal.js';
import { formatTokenMentionUser } from '@/helpers/formatTokenMentionUser.js';
import { useX3ProTokenInfo } from '@/hooks/token/useX3ProTokenInfo.js';
import { type TokenMentionUser } from '@/providers/x3pro/types.js';

interface Args {
    open: boolean;
    users: TokenMentionUser[];
    address?: string;
}

const meta = {
    title: 'Token/MentionedByModal',
    render: function Render({ address, open: propOpen, users: propUsers }) {
        const [open, setOpen] = useState(propOpen);
        const { data: x3Token } = useX3ProTokenInfo(address);
        const users = x3Token?.mentionUsers.map(formatTokenMentionUser) ?? propUsers.map(formatTokenMentionUser);
        return <MentionedByModal open={open} users={users} onClose={() => setOpen(false)} />;
    },
} satisfies Meta<Args>;

type Story = StoryObj<Args>;

export const Modal: Story = {
    args: {
        open: true,
        users: [
            {
                avatar: 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com//X/AVATAR/IMG/4977a2f1f6b04e5585ef6f2808d6693e.jpg',
                fanCount: 14568,
                id: 'x_1393399142680993792',
                twitterId: '1393399142680993792',
                name: '0x江屿(金狗版)',
                post: null,
                postUrl: null,
                screenName: 'MintClub001',
                verifyType: 1,
            },
            {
                avatar: 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com//X/AVATAR/IMG/2a80dccfa87a4e2db33952f924342029.jpg',
                fanCount: 1735,
                id: 'x_1664691536842625024',
                twitterId: '1664691536842625024',
                name: 'MemeCoinKing',
                post: null,
                postUrl: null,
                screenName: 'memeking171',
                verifyType: 1,
            },
            {
                avatar: 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com//X/AVATAR/IMG/f41f95c138e545bdada071ab6ba041d2.jpg',
                fanCount: 9551,
                id: 'x_1712041033389764608',
                twitterId: '1712041033389764608',
                name: 'Crypto Analyst',
                post: null,
                postUrl: null,
                screenName: 'DataC58218',
                verifyType: 1,
            },
            {
                avatar: 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com//X/AVATAR/IMG/3f105c28a7e941938d681704d35104a5.jpg',
                fanCount: 2466,
                id: 'x_1716747165224378368',
                twitterId: '1716747165224378368',
                name: '凯胜Fayu👾',
                post: null,
                postUrl: null,
                screenName: 'ksfayu',
                verifyType: 1,
            },
            {
                avatar: 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com//X/AVATAR/IMG/4180c2378cf54f7eb5d516f5e3ce4749.jpg',
                fanCount: 14293,
                id: 'x_1717940494422978567',
                twitterId: '1717940494422978567',
                name: '链智',
                post: null,
                postUrl: null,
                screenName: 'lianzhi_crypto',
                verifyType: 1,
            },
        ],
        address: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    },
};

export default meta;
