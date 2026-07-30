import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// ── Config ─────────────────────────────────────────────────────────────────────

interface StorageConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

/**
 * Extract the Supabase project base URL from a database connection string.
 * Works for both the direct connection (db.REF.supabase.co) and the
 * PgBouncer pooler (postgres.REF@*.pooler.supabase.com).
 */
function deriveSupabaseUrl(dbUrl: string): string | null {
  try {
    const noProto = dbUrl.replace(/^postgres(?:ql)?:\/\//, '');
    const lastAt = noProto.lastIndexOf('@');
    const creds   = noProto.substring(0, lastAt);
    const hostPart = noProto.substring(lastAt + 1);
    const host     = hostPart.split('/')[0].split(':')[0];

    // Direct connection: db.PROJECTREF.supabase.co
    const direct = host.match(/^db\.([^.]+)\.supabase\.co$/);
    if (direct) return `https://${direct[1]}.supabase.co`;

    // Pooler: username is postgres.PROJECTREF
    const user = creds.split(':')[0];
    const pooler = user.match(/^postgres\.(.+)$/);
    if (pooler) return `https://${pooler[1]}.supabase.co`;

    return null;
  } catch {
    return null;
  }
}

function getConfig(): StorageConfig | null {
  let url = process.env.SUPABASE_URL?.trim();
  // Fallback: derive the project URL from the database connection string
  // so SUPABASE_URL doesn't need to be set as a separate env var.
  if (!url && process.env.SUPABASE_DATABASE_URL) {
    url = deriveSupabaseUrl(process.env.SUPABASE_DATABASE_URL) ?? undefined;
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET?.trim()) || 'media';
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey, bucket };
}

let _client: SupabaseClient | null = null;

function getClient(cfg: StorageConfig): SupabaseClient {
  if (!_client) {
    _client = createClient(cfg.url, cfg.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

// ── Folder mapping ─────────────────────────────────────────────────────────────

const FOLDER_MAP: Record<string, string> = {
  'branding':         'branding',
  'author':           'authors',
  'article-featured': 'articles/featured',
  'article-gallery':  'articles/gallery',
  'article-pdf':      'articles/pdfs',
  'pages':            'pages',
  'testimonials':     'testimonials',
};

export function folderForPurpose(purpose?: string): string {
  if (!purpose) return 'uploads';
  return FOLDER_MAP[purpose] ?? 'uploads';
}

// ── Validation ─────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
]);
const ALLOWED_DOC_TYPES = new Set(['application/pdf']);
const ALLOWED_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_DOC_SIZE   = 50 * 1024 * 1024;  // 50 MB

export function validateUpload(contentType: string, sizeBytes: number): void {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new UploadValidationError(
      `File type "${contentType}" is not allowed. Accepted: JPG, PNG, WebP, GIF, SVG, PDF.`
    );
  }
  const maxSize = ALLOWED_DOC_TYPES.has(contentType) ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;
  if (sizeBytes > maxSize) {
    const limit = maxSize / (1024 * 1024);
    throw new UploadValidationError(`File exceeds the ${limit} MB limit.`);
  }
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadValidationError';
    Object.setPrototypeOf(this, UploadValidationError.prototype);
  }
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase Storage is not configured. ' +
      'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET environment variables.'
    );
    this.name = 'StorageNotConfiguredError';
    Object.setPrototypeOf(this, StorageNotConfiguredError.prototype);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extensionFromContentType(ct: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
    'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
  };
  return map[ct] ?? '';
}

// ── Service ────────────────────────────────────────────────────────────────────

export class ObjectStorageService {
  /**
   * Generate a Supabase signed upload URL.
   * @param contentType  MIME type of the file
   * @param folder       Storage folder (e.g. "articles/pdfs", "branding", "authors")
   */
  async getObjectEntityUploadURL(contentType?: string, folder = 'uploads'): Promise<{
    uploadURL: string;
    objectPath: string;
    servingUrl: string;
  }> {
    const cfg = getConfig();
    if (!cfg) throw new StorageNotConfiguredError();

    const ext = contentType ? extensionFromContentType(contentType) : '';
    const objectPath = `${folder}/${randomUUID()}${ext}`;

    const supabase = getClient(cfg);
    const { data, error } = await supabase.storage
      .from(cfg.bucket)
      .createSignedUploadUrl(objectPath, { upsert: false });

    if (error || !data) {
      logger.error({ err: error }, 'Failed to create Supabase signed upload URL');
      throw new Error(`Failed to create upload URL: ${error?.message ?? 'unknown error'}`);
    }

    const uploadURL = data.signedUrl;
    const servingUrl = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${objectPath}`;

    return { uploadURL, objectPath, servingUrl };
  }

  /**
   * Delete an object from Supabase Storage by its public serving URL.
   * Best-effort — logs a warning on failure but does not throw.
   */
  async deleteObject(servingUrl: string): Promise<void> {
    const cfg = getConfig();
    if (!cfg) return;

    const prefix = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/`;
    if (!servingUrl.startsWith(prefix)) {
      logger.warn({ servingUrl }, 'deleteObject: URL does not belong to configured bucket — skipping');
      return;
    }

    const key = servingUrl.slice(prefix.length);
    if (!key) return;

    const supabase = getClient(cfg);
    const { error } = await supabase.storage.from(cfg.bucket).remove([key]);
    if (error) {
      logger.warn({ err: error, key }, 'Failed to delete storage object');
    } else {
      logger.info({ key }, 'Storage object deleted');
    }
  }

  /**
   * Redirect to the Supabase public URL for an object.
   * Kept for backward compatibility with /storage/objects/* proxy routes.
   */
  async downloadObject(objectPath: string): Promise<Response> {
    const cfg = getConfig();
    if (!cfg) throw new ObjectNotFoundError();

    // Map legacy /objects/{uuid} → uploads/{uuid}
    const key = objectPath.startsWith('/objects/')
      ? `uploads/${objectPath.slice('/objects/'.length)}`
      : objectPath.replace(/^\//, '');

    const publicUrl = `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${key}`;
    return Response.redirect(publicUrl, 302);
  }

  /**
   * Backward compat: normalize a GCS URL → /objects/{id}.
   * New Supabase URLs pass through unchanged.
   */
  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith('https://storage.googleapis.com/')) {
      try {
        const url = new URL(rawPath);
        const dir = (process.env.PRIVATE_OBJECT_DIR || '').replace(/\/$/, '') + '/';
        const p = url.pathname;
        if (dir.length > 1 && p.startsWith(dir)) {
          return `/objects/${p.slice(dir.length)}`;
        }
      } catch { /* fall through */ }
    }
    return rawPath;
  }
}

export const objectStorageService = new ObjectStorageService();
