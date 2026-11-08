#!/usr/bin/env node
/**
 * Writes src/data/assetVersions.json: for every file in assets/ (and
 * public/admin.css), a short
 * fingerprint (the same one GitHub shows for the file). Image links carry it
 * as ?v=…, so a photo replaced in the repo shows up straight away, without
 * the visitor's phone asking GitHub for the file list on every page view.
 *
 * Runs before every build and dev start (see package.json).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const assetsDir = join(root, 'assets');
const out = join(root, 'src', 'data', 'assetVersions.json');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return name.startsWith('.') ? [] : [p];
});

// Git's blob id: sha1("blob <size>\0<content>")
const blobId = (buf) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const versions = {};
// public/admin.css (admin panel styles) is fingerprinted too, so the admin page
// always loads the current version
for (const file of [...walk(assetsDir).sort(), join(root, 'public', 'admin.css')]) {
    versions[relative(root, file).split(sep).join('/')] = blobId(readFileSync(file)).slice(0, 7);
}

writeFileSync(out, `${JSON.stringify(versions, null, 1)}\n`);
console.log(`asset versions: ${Object.keys(versions).length} files → ${relative(root, out)}`);
