import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const requiredPages = [
  'index.html',
  'ueber-mich.html',
  'leistungen.html',
  'portfolio.html',
  'portfolio/webdesign-elektrobetrieb.html',
  'blog.html',
  'blog-artikel.html',
  'impressum.html',
  'datenschutz.html'
];

const ignoredDirs = new Set(['.git', 'dist', 'node_modules', 'playwright-report', 'test-results', 'tests']);
const cssFiles = ['assets/css/style.css', 'assets/css/portfolio-elektrobetrieb.css'];
const jsFiles = ['assets/js/script.js', 'assets/js/blog-cms.js', 'assets/js/portfolio-elektrobetrieb.js'];

async function collectFiles(dir, extension, bucket = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      await collectFiles(path.join(dir, entry.name), extension, bucket);
      continue;
    }

    if (entry.name.endsWith(extension)) {
      bucket.push(path.join(dir, entry.name));
    }
  }

  return bucket;
}

function normalizeLocalRef(ref) {
  if (!ref) return null;
  if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(ref)) return null;

  const clean = ref.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return null;
  if (clean.startsWith('/cdn-cgi/')) return null;
  if (clean === '/agb' || clean === './agb') return null;

  return decodeURIComponent(clean);
}

for (const page of requiredPages) {
  try {
    await fs.access(path.join(root, page));
  } catch {
    errors.push(`Missing required page: ${page}`);
  }
}

const htmlFiles = await collectFiles(root, '.html');

for (const filePath of htmlFiles) {
  const file = path.relative(root, filePath).replaceAll('\\', '/');
  const raw = await fs.readFile(filePath, 'utf8');

  const refs = [];
  const attrRegex = /\b(?:src|href)\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = attrRegex.exec(raw)) !== null) refs.push(match[1]);

  for (const ref of refs) {
    if (ref.includes('\\')) {
      errors.push(`${file}: backslash in path "${ref}"`);
    }

    const local = normalizeLocalRef(ref);
    if (!local) continue;

    const target = local.startsWith('/')
      ? path.join(root, local.slice(1))
      : path.resolve(path.dirname(filePath), local);

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
  let match;
  while ((match = urlRegex.exec(raw)) !== null) {
    const ref = match[1].trim().replace(/^['"]|['"]$/g, '');
    if (ref.includes('\\')) {
      errors.push(`${rel}: backslash in css url "${ref}"`);
    }
  }
}

for (const rel of jsFiles) {
  try {
    const raw = await fs.readFile(path.join(root, rel), 'utf8');
    new Function(raw);
  } catch (err) {
    errors.push(`${rel}: syntax error\n${err.message}`);
  }
}

if (errors.length) {
  console.error('Lint failed:\n' + errors.map((entry) => `- ${entry}`).join('\n'));
  process.exit(1);
}

console.log('Lint passed');