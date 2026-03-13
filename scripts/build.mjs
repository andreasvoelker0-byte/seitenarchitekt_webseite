import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

const entries = [
  'index.html',
  'ueber-mich.html',
  'leistungen.html',
  'portfolio.html',
  'portfolio',
  'blog.html',
  'blog-artikel.html',
  'impressum.html',
  'datenschutz.html',
  'favicon.ico',
  'form-submit.php',
  'assets'
];

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const children = await fs.readdir(src);
    for (const child of children) {
      await copyRecursive(path.join(src, child), path.join(dest, child));
    }
    return;
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const rel of entries) {
  const src = path.join(root, rel);
  await copyRecursive(src, path.join(dist, rel));
}

console.log('Build complete: dist created');