const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IMAGE_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp']);
const SKIP_DIRS = new Set(['generated', 'imported', 'iconify', 'ai', 'usage', 'node_modules', '.git', '.github', 'scripts']);

function titleCase(value) {
  return value
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tagsFromPath(relativePath) {
  return [...new Set(relativePath
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[\\/ _-]+/)
    .map((x) => x.toLowerCase())
    .filter((x) => x.length > 1 && !['stickers', 'backgrounds', 'custom'].includes(x))
  )].slice(0, 12);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name.toLowerCase())) continue;
      out.push(...walk(full));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

function makeRecord(filePath, rootName) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  const filename = parts[parts.length - 1];
  const id = rel
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const category = parts.length > 2 ? parts[1] : 'custom';
  return {
    id,
    title: titleCase(filename),
    category,
    tags: tagsFromPath(rel),
    src: rel,
    source: 'manual'
  };
}

const stickers = walk(path.join(ROOT, 'stickers')).map((file) => makeRecord(file, 'stickers'));
const backgrounds = walk(path.join(ROOT, 'backgrounds')).map((file) => makeRecord(file, 'backgrounds'));

const library = {
  version: Date.now(),
  updatedAt: new Date().toISOString(),
  stickers,
  backgrounds
};

fs.writeFileSync(path.join(ROOT, 'library.json'), `${JSON.stringify(library, null, 2)}\n`);
console.log(`library.json aggiornato: ${stickers.length} sticker, ${backgrounds.length} sfondi.`);
