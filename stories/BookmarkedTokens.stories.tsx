import type { Meta, StoryObj } from '@storybook/react';

import BookmarkedTokens from '@/components/Token/BookmarkedTokens.js';

const meta = {
    title: 'Token/BookmarkedTokens',
    component: BookmarkedTokens,
    render: (args) => {
        return (
            <div className="flex flex-col gap-4">
                <BookmarkedTokens {...args} />
            </div>
        );
    },
} satisfies Meta<typeof BookmarkedTokens>;

type Story = StoryObj<typeof meta>;
export const Default: Story = {
    args: {
        className: 'w-[415px]',
    },
};

export default meta;
