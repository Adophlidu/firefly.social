/* cspell:disable */

'use client';

import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SITE_DESCRIPTION, SITE_NAME } from '@/constants/index.js';
import { enqueueInfoMessage, enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { type Mention, type MethodItem, Network, Platform, SupportedMethod } from '@/types/bridge.js';

interface Props {
    item: MethodItem;
}

export function BridgeMethodButton({ item }: Props) {
    const [{ loading }, onClick] = useAsyncFn(async () => {
        try {
            switch (item.name) {
                case SupportedMethod.GET_SUPPORTED_METHODS: {
                    const methods = await fireflyBridgeProvider.request(SupportedMethod.GET_SUPPORTED_METHODS, {});
                    enqueueInfoMessage(JSON.stringify(methods, null, 2));
                    break;
                }
                case SupportedMethod.GET_WALLET_ADDRESS: {
                    const items = await fireflyBridgeProvider.request(SupportedMethod.GET_WALLET_ADDRESS, {
                        type: Network.All,
                    });
                    enqueueInfoMessage(JSON.stringify(items, null, 2));
                    break;
                }
                case SupportedMethod.GET_AUTHORIZATION: {
                    const token = await fireflyBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {});
                    enqueueInfoMessage(`Authorization: ${token}`);
                    break;
                }
                case SupportedMethod.GET_THEME: {
                    const theme = await fireflyBridgeProvider.request(SupportedMethod.GET_THEME, {});
                    enqueueInfoMessage(`Theme: ${theme}`);
                    break;
                }
                case SupportedMethod.GET_LANGUAGE: {
                    const language = await fireflyBridgeProvider.request(SupportedMethod.GET_LANGUAGE, {});
                    enqueueInfoMessage(`Language: ${language}`);
                    break;
                }
                case SupportedMethod.CONNECT_WALLET: {
                    const walletAddress = await fireflyBridgeProvider.request(SupportedMethod.CONNECT_WALLET, {
                        type: Network.All,
                    });
                    enqueueInfoMessage(`Wallet Address: ${walletAddress}`);
                    break;
                }
                case SupportedMethod.BIND_WALLET: {
                    const walletAddress = await fireflyBridgeProvider.request(SupportedMethod.BIND_WALLET, {
                        type: Network.EVM,
                    });
                    enqueueInfoMessage(`Wallet Address: ${walletAddress}`);
                    break;
                }
                case SupportedMethod.IS_TWITTER_USER_FOLLOWING: {
                    const following = await fireflyBridgeProvider.request(SupportedMethod.IS_TWITTER_USER_FOLLOWING, {
                        id: '952921795316912133',
                    });
                    enqueueInfoMessage(`Following: ${following}`);
                    break;
                }
                case SupportedMethod.FOLLOW_TWITTER_USER: {
                    const followed = await fireflyBridgeProvider.request(SupportedMethod.FOLLOW_TWITTER_USER, {
                        id: '952921795316912133',
                    });
                    enqueueInfoMessage(`Followed: ${followed}`);
                    break;
                }
                case SupportedMethod.UPDATE_NAVIGATOR_BAR: {
                    await fireflyBridgeProvider.request(SupportedMethod.UPDATE_NAVIGATOR_BAR, {
                        show: true,
                        title: `${SITE_NAME} ${Math.random()}`,
                    });
                    break;
                }
                case SupportedMethod.OPEN_URL: {
                    fireflyBridgeProvider.request(SupportedMethod.OPEN_URL, { url: 'https://firefly.land' });
                    break;
                }
                case SupportedMethod.LOGIN: {
                    const result = await fireflyBridgeProvider.request(SupportedMethod.LOGIN, {
                        platform: Platform.FARCASTER,
                    });
                    enqueueInfoMessage(`Success: ${result}`);
                    break;
                }
                case SupportedMethod.SHARE:
                    fireflyBridgeProvider.request(SupportedMethod.SHARE, { text: SITE_NAME });
                    break;
                case SupportedMethod.COMPOSE:
                    fireflyBridgeProvider.request(SupportedMethod.COMPOSE, {
                        text: `${SITE_DESCRIPTION} @thefireflyapp`,
                        activity: 'firefly',
                        mentions: [
                            {
                                content: '@thefireflyapp',
                                profiles: [
                                    {
                                        platform_id: '0x01d86b',
                                        platform: Platform.LENS,
                                        handle: 'brian',
                                        name: 'brian',
                                        namespace: 'lens',
                                        hit: false,
                                        score: 0,
                                    },
                                    {
                                        platform_id: '20',
                                        platform: Platform.FARCASTER,
                                        handle: 'barmstrong',
                                        name: 'Brian Armstrong',
                                        namespace: '',
                                        hit: false,
                                        score: 0,
                                    },
                                    {
                                        platform_id: '14379660',
                                        platform: Platform.TWITTER,
                                        handle: 'brian_armstrong',
                                        name: 'brian_armstrong',
                                        namespace: '',
                                        hit: true,
                                        score: 0.062500186,
                                    },
                                ],
                            },
                        ] as Mention[],
                    });
                    break;
                case SupportedMethod.BACK:
                    fireflyBridgeProvider.request(SupportedMethod.BACK, {});
                    break;
                case SupportedMethod.CLOSE:
                    fireflyBridgeProvider.request(SupportedMethod.CLOSE, {});
                    break;
                case SupportedMethod.SET_PRIMARY_BUTTON:
                    fireflyBridgeProvider.request(SupportedMethod.SET_PRIMARY_BUTTON, { text: 'Primary Button' });
                    break;
                case SupportedMethod.SET_FRAME_READY_OPTIONS:
                    fireflyBridgeProvider.request(SupportedMethod.SET_FRAME_READY_OPTIONS, {
                        disableNativeGestures: true,
                    });
                    break;
                case SupportedMethod.GET_CHAIN_ID: {
                    const chainId = await fireflyBridgeProvider.request(SupportedMethod.GET_CHAIN_ID, {
                        type: Network.EVM,
                    });
                    enqueueInfoMessage(`Chain ID: ${chainId}`);
                    break;
                }
                case SupportedMethod.ADD_ETHEREUM_CHAIN: {
                    const added = await fireflyBridgeProvider.request(SupportedMethod.ADD_ETHEREUM_CHAIN, {
                        chainId: '0x64',
                        chainName: 'Gnosis',
                        rpcUrls: ['https://rpc.gnosischain.com'],
                        iconUrls: [
                            'https://xdaichain.com/fake/example/url/xdai.svg',
                            'https://xdaichain.com/fake/example/url/xdai.png',
                        ],
                        nativeCurrency: {
                            name: 'XDAI',
                            symbol: 'XDAI',
                            decimals: 18,
                        },
                        blockExplorerUrls: ['https://blockscout.com/poa/xdai/'],
                    });
                    enqueueInfoMessage(`Added: ${added}`);
                    break;
                }
                case SupportedMethod.SWITCH_ETHEREUM_CHAIN: {
                    const switched = await fireflyBridgeProvider.request(SupportedMethod.SWITCH_ETHEREUM_CHAIN, {
                        chainId: '0x64',
                    });
                    enqueueInfoMessage(`Switched: ${switched}`);
                    break;
                }
                case SupportedMethod.SIGN_TRANSACTION: {
                    const rawTransaction = await fireflyBridgeProvider.request(SupportedMethod.SIGN_TRANSACTION, {
                        type: '0x2',
                        nonce: '0x1',
                        to: '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb',
                        from: '0x660265edc169bab511a40c0e049cc1e33774443d',
                        value: '0x0',
                        data: '0x',
                        gasLimit: '0x5208',
                        maxPriorityFeePerGas: '0x3b9aca00',
                        maxFeePerGas: '0x2540be400',
                        chainId: '0xaa36a7',
                    });
                    enqueueInfoMessage(`Raw Transaction: ${rawTransaction}`);
                    break;
                }
                case SupportedMethod.SIGN_MESSAGE: {
                    const signed = await fireflyBridgeProvider.request(SupportedMethod.SIGN_MESSAGE, {
                        address: '0x660265edc169bab511a40c0e049cc1e33774443d',
                        message: 'hello world',
                    });
                    enqueueInfoMessage(`Signed Message: ${signed}`);
                    break;
                }
                case SupportedMethod.SIGN_TYPED_DATA: {
                    const signed = await fireflyBridgeProvider.request(SupportedMethod.SIGN_TYPED_DATA, {
                        address: '0x660265edc169bab511a40c0e049cc1e33774443d',
                        message: JSON.stringify({
                            types: {
                                EIP712Domain: [
                                    { name: 'name', type: 'string' },
                                    { name: 'version', type: 'string' },
                                    { name: 'chainId', type: 'uint256' },
                                    { name: 'verifyingContract', type: 'address' },
                                ],
                                Person: [
                                    { name: 'name', type: 'string' },
                                    { name: 'wallet', type: 'address' },
                                ],
                                Mail: [
                                    { name: 'from', type: 'Person' },
                                    { name: 'to', type: 'Person' },
                                    { name: 'contents', type: 'string' },
                                ],
                            },
                            primaryType: 'Mail',
                            domain: {
                                name: 'Ether Mail',
                                version: '1',
                                chainId: 1,
                                verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
                            },
                            message: {
                                from: {
                                    name: 'Cow',
                                    wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
                                },
                                to: {
                                    name: 'Bob',
                                    wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                                },
                                contents: 'Hello, Bob!',
                            },
                        }),
                    });
                    enqueueInfoMessage(`Signed Typed Data: ${signed}`);
                    break;
                }
                case SupportedMethod.GET_FRAME_CONTEXT: {
                    const context = await fireflyBridgeProvider.request(SupportedMethod.GET_FRAME_CONTEXT, {});
                    enqueueInfoMessage(JSON.stringify(context, null, 2));
                    break;
                }
                default:
                    safeUnreachable(item.name);
                    break;
            }
        } catch (error) {
            enqueueMessageFromError(error, 'Failed to execute method');
            throw error;
        }
    });
    return (
        <ClickableButton
            className="rounded-md bg-main px-2 py-1 text-primaryBottom"
            disabled={loading}
            onClick={onClick}
        >
            <Trans>Invoke</Trans>
        </ClickableButton>
    );
}
