export const IPFS_RE =
    /ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[2-7A-Za-z]{58,}|B[2-7A-Z]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[\\dA-F]{50,})/;
export function isIpfs(ipfs: string | undefined) {
    if (!ipfs) return false;
    return IPFS_RE.test(ipfs);
}

export function extractIpfsCID(ipfs: string) {
    return IPFS_RE.exec(ipfs)?.[1];
}
