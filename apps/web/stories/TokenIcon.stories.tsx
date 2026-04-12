import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TokenIcon, type TokenIconProps } from '@/components/TokenIcon.js';

interface Args {
    tokens: TokenIconProps[];
}

const meta = {
    title: 'Token/TokenIcon',
    render: ({ tokens }) => {
        return (
            <div className="flex flex-col items-center gap-4">
                {tokens.map((x, i) => (
                    <TokenIcon key={i} {...x} />
                ))}
            </div>
        );
    },
} satisfies Meta<Args>;

type Story = StoryObj<typeof meta>;

export const Symbol: Story = {
    args: {
        tokens: [
            {
                name: 'MASK',
                size: 70,
            },
            {
                name: 'MASK',
                size: 40,
            },
            {
                name: 'MASK',
                size: 20,
            },
        ],
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;
