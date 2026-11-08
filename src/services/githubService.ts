/**
 * Links to photos and videos kept in the repo's assets/ folder, served by the
 * jsDelivr CDN.
 *
 * Each link carries the file's fingerprint (?v=…) so a replaced photo shows up
 * straight away. The fingerprints are worked out when the site is built
 * (scripts/asset-versions.mjs → src/data/assetVersions.json) — earlier the
 * visitor's phone asked the GitHub API for the whole file list on every page
 * view, which was slow on mobile data and rate-limited by GitHub.
 */
import ASSET_VERSIONS from '../data/assetVersions.json';

const REPO_OWNER = 'moinwani';
const REPO_NAME = 'Wular_sports';
const BRANCH = 'main';
const REPO_PREFIX = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/`;

const VERSIONS: Record<string, string> = ASSET_VERSIONS;

export interface AssetFile {
    name: string;
    path: string;
}

/** Files directly inside a repo folder (e.g. 'assets/images/hero/mobile'), in natural order */
export function assetFiles(folder: string): AssetFile[] {
    const prefix = folder.endsWith('/') ? folder : `${folder}/`;
    return Object.keys(VERSIONS)
        .filter(p => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
        .map(p => ({ name: p.slice(prefix.length), path: p }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/**
 * CDN link for a repo file, with its fingerprint. Full links to the repo get
 * the fingerprint added; photos uploaded from the admin panel (Vercel Blob,
 * /api/photo/…) and other outside links are returned unchanged.
 */
export function getCDNUrl(pathOrUrl: string, sha?: string): string {
    if ((/^https?:\/\//.test(pathOrUrl) && !pathOrUrl.startsWith(REPO_PREFIX)) || pathOrUrl.startsWith('/api/photo/')) return pathOrUrl;

    let cleanPath = pathOrUrl.startsWith(REPO_PREFIX) ? pathOrUrl.slice(REPO_PREFIX.length) : pathOrUrl;
    cleanPath = (cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath).split('?')[0];

    const version = (sha || VERSIONS[cleanPath] || '').substring(0, 7);
    const baseUrl = `${REPO_PREFIX}${cleanPath}`;
    return version ? `${baseUrl}?v=${version}` : baseUrl;
}
