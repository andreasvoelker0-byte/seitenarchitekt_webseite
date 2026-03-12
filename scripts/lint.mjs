import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const requiredPages = [
  'index.html',
  'ueber-mich.html',
  'leistungen.html',
  'portfolio.html',
  'blog.html',
  'blog-artikel.html',
  'impressum.html',
  'datenschutz.html'
];

for (const page of requiredPages) {
  try {
    await fs.access(path.join(root, page));
  } catch {
    errors.push(`Missing required page: ${page}`);
  }
}

const htmlFiles = (await fs.readdir(root)).filter((f) => f.endsWith('.html'));
const cssFiles = ['assets/css/style.css'];
const jsFiles = ['assets/js/script.js', 'assets/js/blog-cms.js'];

function normalizeLocalRef(ref) {
  if (!ref) return null;
  if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(ref)) return null;

  const clean = ref.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return null;
  if (clean.startsWith('/cdn-cgi/')) return null;
  if (clean === '/agb') return null;

  const decoded = decodeURIComponent(clean);
  if (decoded.startsWith('/')) return decoded.slice(1);
  return decoded;
}

for (const file of htmlFiles) {
  const filePath = path.join(root, file);
  const raw = await fs.readFile(filePath, 'utf8');

  const refs = [];
  const attrRegex = /\b(?:src|href)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = attrRegex.exec(raw)) !== null) refs.push(m[1]);

  for (const ref of refs) {
    if (ref.includes('\\')) {
      errors.push(`${file}: backslash in path "${ref}"`);
    }

    const local = normalizeLocalRef(ref);
    if (!local) continue;

    const target = path.join(root, local);
    try {
      await fs.access(target);
    } catch {
      errors.push(`${file}: missing target "${ref}"`);
    }
  }
}

for (const rel of cssFiles) {
  const raw = await fs.readFile(path.join(root, rel), 'utf8');
  const urlRegex = /url\(([^)]+)\)/g;
  let m;
  while ((m = urlRegex.exec(raw)) !== null) {
    const ref = m[1].trim().replace(/^['"]|['"]$/g, '');
    if (ref.includes('\\')) {
      errors.push(`${rel}: backslash in css url "${ref}"`);
    }
  }
}

for (const rel of jsFiles) {
  try {
    const raw = await fs.readFile(path.join(root, rel), 'utf8');
    // Parse-only syntax check.
    // eslint-disable-next-line no-new-func
    new Function(raw);
  } catch (err) {
    errors.push(`${rel}: syntax error\n${err.message}`);
  }
}

if (errors.length) {
  console.error('Lint failed:\n' + errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}

console.log('Lint passed');
