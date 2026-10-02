const fs = require('fs/promises');
const path = require('path');

const ROOT = '/var/lib/corgi-studio/cosmetics';
const MAX_BYTES = 8 * 1024 * 1024;

const DIRS = {
  FRAME: 'frame',
  BACKGROUND: 'background',
  NAMEPLATE: 'nameplate',
  EFFECT: 'effect'
};

function safeStem(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:/, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

function detectImage(buffer) {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) return { ext: '.png', mime: 'image/png' };

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return { ext: '.jpg', mime: 'image/jpeg' };

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return { ext: '.webp', mime: 'image/webp' };

  return null;
}

async function downloadAttachment(attachment) {
  if (!attachment?.url) throw new Error('IMAGE_REQUIRED');

  if (
    attachment.size &&
    Number(attachment.size) > MAX_BYTES
  ) throw new Error('IMAGE_TOO_LARGE');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(attachment.url, {
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`IMAGE_DOWNLOAD_${response.status}`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_BYTES) throw new Error('IMAGE_TOO_LARGE');

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  const buffer = Buffer.from(arrayBuffer);
  const detected = detectImage(buffer);

  if (!detected) {
    throw new Error('INVALID_IMAGE_TYPE');
  }

  return { buffer, ...detected };
}

async function removeExistingVariants(dir, stem) {
  for (const ext of ['.png', '.jpg', '.webp']) {
    await fs.rm(path.join(dir, `${stem}${ext}`), { force: true });
  }
}

async function save(type, key, attachment) {
  type = String(type || '').trim().toUpperCase();

  const folder = DIRS[type];
  if (!folder) throw new Error('TYPE_HAS_NO_IMAGE');

  const stem = safeStem(key);
  if (!stem) throw new Error('INVALID_ASSET_KEY');

  const { buffer, ext } = await downloadAttachment(attachment);

  const dir = path.join(ROOT, folder);
  await fs.mkdir(dir, { recursive: true });

  await removeExistingVariants(dir, stem);

  const filename = `${stem}${ext}`;
  const absolute = path.join(dir, filename);

  await fs.writeFile(absolute, buffer, { mode: 0o644 });

  return {
    reference: `asset:${folder}/${filename}`,
    absolute,
    bytes: buffer.length
  };
}

async function remove(reference) {
  const raw = String(reference || '');

  if (!raw.startsWith('asset:')) return false;

  const relative = raw.slice(6);
  const absolute = path.resolve(ROOT, relative);
  const root = path.resolve(ROOT) + path.sep;

  if (!absolute.startsWith(root)) {
    throw new Error('INVALID_ASSET_REFERENCE');
  }

  await fs.rm(absolute, { force: true });
  return true;
}

function resolve(reference) {
  const raw = String(reference || '');
  if (!raw.startsWith('asset:')) return null;

  const relative = raw.slice(6);
  const absolute = path.resolve(ROOT, relative);
  const root = path.resolve(ROOT) + path.sep;

  if (!absolute.startsWith(root)) return null;
  return absolute;
}

function requiresImage(type) {
  return Object.prototype.hasOwnProperty.call(
    DIRS,
    String(type || '').toUpperCase()
  );
}

module.exports = {
  ROOT,
  MAX_BYTES,
  requiresImage,
  save,
  remove,
  resolve
};
