import '../src/app/globals.css';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';

import { EmojiActionUI } from '@/components/Compose/ComposeActions/EmojiAction.jsx';

const meta = {
    title: 'common/Action/Compose/EmojiAction',
    component: EmojiActionUI,
    decorators: [
        (Story) => (
            <div style={{ margin: '10em 20em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EmojiActionUI>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        old: false,
        isDarkMode: false,
        isMedium: false,
        onEmojiClick: action('onEmojiClick'),
        open: true,
        setOpen: action('setOpen'),
    },
};
export default meta;
