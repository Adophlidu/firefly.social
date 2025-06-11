import '../src/app/globals.css';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';

import { MirrorUI } from '@/components/Actions/Mirror.js';
import { Source } from '@/constants/enum.js';

const meta = {
    title: 'common/Action/Mirror',
    component: MirrorUI,
    decorators: [
        (Story) => (
            <div style={{ margin: '10em 20em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MirrorUI>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        old: false,
        source: Source.Lens,
        postId: 'postId',
        canUndoMirror: true,
        disabled: false,
        handleMirror: action('handleMirror'),
        handleQuote: action('handleQuote'),
        hasQuoted: true,
        mirrorDisabled: false,
        mirrored: false,
        mirrorLoading: false,
        onClick: action('onClick'),
        open: true,
        quoteDisabled: false,
        setOpen: action('setOpen'),
        shares: 1,
    },
};
export default meta;
