import { type Meta, type StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

interface Args {
    paths: string[];
}

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
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <span>select:</span>
                    <select onChange={(e) => setHost(e.target.value)}>
                        {hosts.map((host) => (
                            <option key={host} value={host}>
                                {host}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-1">
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
            '/token/mask-network',
            '/token/mask-network?isCoinId=true',
            '/token/MASK?chainId=137&address=0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7&trader=0xa1faa2220b9ca5150ac3e13b216a5a83b715434f',
            '/token/ETH',
            '/token/trump',
            '/token/official-trump?isCoinId=true',
            '/token/official-trump',
            '/token/QR/feeds?chainId=8453&trader=0x26d46809a92ea3dacdc2965919e0b91613b39efe&address=0x2b5050f01d64fbb3e4ac44dc07f0732bfb5ecadf',
            '/token/bittensor?isCoinId=true',
            '/token/bittensor',
            '/token/VIRTUAL?chainId=8453&address=0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b',
            '/token/VIRTUAL?chainId=101&address=3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y',
            '/token/LIBERTY',
        ],
    },
};

export default meta;
