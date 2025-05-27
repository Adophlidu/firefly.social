import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

type Args = {
    paths: string[];
};

const meta: Meta<Args> = {
    title: 'Token/TokenPage',
    render: function Render({ paths }) {
        const [host, setHost] = useState('http://localhost:3000');
        const hosts = [
            'http://localhost:3000',
            'https://firefly.social',
            'https://canary.firefly.social',
            'https://staging.firefly.social',
        ];

        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span>select:</span>
                    <select onChange={(e) => setHost(e.target.value)}>
                        {hosts.map((host) => (
                            <option key={host} value={host}>
                                {host}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span>input:</span>
                    <input type="text" value={host} onChange={(e) => setHost(e.target.value)} />
                </div>
                {paths.map((path) => {
                    const url = `${host}${path}`;
                    return (
                        <a key={path} className="text-link hover:underline" target="_blank" href={url}>
                            {url}
                        </a>
                    );
                })}
            </div>
        );
    },
};

type Story = StoryObj<typeof meta>;

export const TokenPage: Story = {
    args: {
        paths: [
            '/token/MASK',
            '/token/ETH',
            '/token/trump',
            '/token/official-trump?isCoinId=true',
            '/token/QR/feeds?chainId=8453&trader=0x26d46809a92ea3dacdc2965919e0b91613b39efe&address=0x2b5050f01d64fbb3e4ac44dc07f0732bfb5ecadf',
        ],
    },
};

export default meta;
