import { parseUrl } from '@dimensiondev/utils';
import type { LinkProps } from '@/esm/Link.js';

const trustedHosts = [
    // explorer hosts
    'etherscan.io',
    'ropsten.etherscan.io',
    'rinkeby.etherscan.io',
    'goerli.etherscan.io',
    'kovan.etherscan.io',
    'basescan.org',
    'goerli.basescan.org',
    'bscscan.com',
    'testnet.bscscan.com',
    'polygonscan.com',
    'explorer-mumbai.maticvigil.com',
    'arbiscan.io',
    'rinkeby-explorer.arbitrum.io',
    'optimistic.etherscan.io',
    'blockscout.com',
    'scrollscan.com',
    'celoscan.io',
    'snowtrace.dev',
    'testnet.snowtrace.io',
    'explorer.mainnet.aurora.dev',
    'aurorascan.dev',
    'evm.confluxscan.net',
    'evmtestnet.confluxscan.net',
    'ftmscan.com',
    'www.okx.com',
    'xdcscan.io',
    'www.coinex.net',
    'explorer.syscoin.org',
    'scan.meter.io',
    'explorer.nextsmartchain.com',
    'evmexplorer.velas.com',
    'viewblock.io',
    'www.hecoinfo.com',
    'bobascan.com',
    'explorer.kcc.io',
    'explorer.thetatoken.org',
    'explorer.functionx.io',
    'andromeda-explorer.metis.io',
    'moonbeam.moonscan.io',
    'moonriver.moonscan.io',
    'evm.explorer.canto.io',
    'escan.live',
    'nova-explorer.arbitrum.io',
    'explorer.emerald.oasis.dev',
    'explorer.zora.energy',
    'explorer.zksync.io',
    'explorer.linea.build',
    'explorer.lens.xyz',
    'explorer.solana.com',
    'dexscreener.com',
    'tiktok.com',
    'instagram.com',
    'youtube.com',
    'orb.club',
    'solscan.io',

    // mask community
    'mask.io',
    'mask.notion.site',
    'localhost',
    'rootdata.com',
    't.me',
    'reddit.com',
    'linkedin.com',
    'x3.pro',
    'discord.com',
    'pump.fun',
    'polymarket.com',
    'app.opinion.trade',
    'x.com',
    'twitter.com',
    'vxtwitter.com', // third-party twitter url converter
    'farcaster.xyz',

    // articles platforms
    'matters.town',

    /^([\w-]+\.)*firefly\.land$/,
    /^([\w-]+\.)*firefly\.social$/,
    /^([\w-]+\.)*mask\.social$/,
];

export function isTrustedUrl(href: LinkProps['href']) {
    if (typeof href !== 'string' || !href.startsWith('http')) return true;

    const parsed = parseUrl(href);
    return parsed
        ? trustedHosts.some((host) => {
              return typeof host === 'string'
                  ? parsed.host === host || parsed.host.endsWith(`.${host}`)
                  : host.test(parsed.host);
          })
        : true;
}
