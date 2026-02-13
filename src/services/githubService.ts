/**
 * Service to handle dynamic image discovery and cache-busting via GitHub API
 * Optimized with recursive tree fetching to minimize API calls.
 */

const REPO_OWNER = 'moinwani';
const REPO_NAME = 'Wular_sports';
const BRANCH = 'main';

export interface GitHubFile {
    name: string;
    path: string;
    sha: string;
    size?: number;
    type: 'file' | 'dir';
}

interface RepoTreeEntry {
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
}

let assetCache: Map<string, string> = new Map(); // path -> sha
let treeCache: RepoTreeEntry[] = [];
let isInitialized = false;

/**
 * Initializes the asset cache by fetching the entire repository tree.
 * This allows us to have SHAs for all files with just ONE API call.
 */
export async function initializeAssetCache(): Promise<void> {
    if (isInitialized) return;
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`);
        if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);
        const data = await response.json();
        treeCache = data.tree || [];

        assetCache.clear();
        treeCache.forEach(entry => {
            if (entry.type === 'blob') {
                assetCache.set(entry.path, entry.sha);
            }
        });

        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize GitHub asset cache:', error);
    }
}

/**
 * Fetches a list of files in a GitHub directory using the cached tree.
 */
export async function getFolderFiles(path: string): Promise<GitHubFile[]> {
    await initializeAssetCache();
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;

    return treeCache
        .filter(entry => entry.path.startsWith(normalizedPath) && entry.type === 'blob')
        .map(entry => ({
            name: entry.path.replace(normalizedPath, ''),
            path: entry.path,
            sha: entry.sha,
            size: entry.size,
            type: 'file'
        }));
}

/**
 * Generates a jsDelivr CDN URL with a cache-busting SHA parameter.
 * Also handles full URLs by extracting the path and appending the cached SHA.
 */
export function getCDNUrl(pathOrUrl: string, sha?: string): string {
    const repoPrefix = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/`;

    // Extract path if it's a full repo URL
    let cleanPath = pathOrUrl;
    if (pathOrUrl.startsWith(repoPrefix)) {
        cleanPath = pathOrUrl.replace(repoPrefix, '');
    }

    // Strip leading slash and existing query params for cache lookup
    cleanPath = (cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath).split('?')[0];

    const finalSha = sha || assetCache.get(cleanPath);
    const baseUrl = `${repoPrefix}${cleanPath}`;

    // Add cache-buster if SHA is available
    return finalSha ? `${baseUrl}?v=${finalSha.substring(0, 7)}` : baseUrl;
}

/**
 * Fetches the latest SHA for a specific file from the cache.
 */
export async function getFileSHA(path: string): Promise<string | null> {
    await initializeAssetCache();
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return assetCache.get(cleanPath) || null;
}
