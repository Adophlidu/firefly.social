import { type Meta, type StoryObj } from '@storybook/nextjs-vite';

import { BioMarkup } from '@/components/Markup/BioMarkup.js';

interface Args {
    bios: string[];
}

const meta = {
    title: 'common/BioMarkup',
    render: ({ bios }: Args) => {
        return (
            <div className="flex flex-col gap-2">
                {bios.map((bio: string) => (
                    <div key={bio} className="flex flex-col gap-2 border p-2">
                        <blockquote className="text-second text-sm italic">{bio}</blockquote>
                        <BioMarkup key={bio}>{bio}</BioMarkup>
                    </div>
                ))}
            </div>
        );
    },
} satisfies Meta<Args>;

export const Base: StoryObj<typeof meta> = {
    args: {
        bios: [
            'アパレル👗@mistreass カラコン🩷@majetteofficial公式ファンクラブ🎀⇨https://t.co/yLnVMfuyBtお仕事依頼はこちら💌⇨yuamikami.management@gmail.com', // tco link right before email
            'https://t.co/yLnVMfuyBt', // tco link
        ],
    },
};

export default meta;
