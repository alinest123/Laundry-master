/**
 * Shared upload utilities for Supabase Storage uploads.
 *
 * Flow:
 *  1. Request a signed upload URL from the API (POST /api/storage/uploads/request-url)
 *  2. PUT the file directly to Supabase via XHR (enables progress tracking)
 *  3. Store the returned servingUrl in the database
 */

export type UploadPurpose =
  | 'branding'
  | 'author'
  | 'article-featured'
  | 'article-gallery'
  | 'article-pdf'
  | 'pages'
  | 'testimonials';

export interface UploadResult {
  servingUrl: string;
  objectPath: string;
}

/** Request a signed upload URL from the API server. */
export async function requestUploadUrl(
  file: File,
  purpose: UploadPurpose,
  apiOrigin = '',
): Promise<{ uploadURL: string; objectPath: string; servingUrl: string }> {
  const res = await fetch(`${apiOrigin}/api/storage/uploads/request-url`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type, purpose }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error((e as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * PUT a file to the given signed URL using XHR so we can track progress.
 * @param onProgress  Called with 0–100 as bytes are sent.
 */
export function uploadWithXhr(
  uploadURL: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    xhr.open('PUT', uploadURL);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Full upload pipeline: get signed URL → PUT with progress → return servingUrl.
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  onProgress?: (percent: number) => void,
  apiOrigin = '',
): Promise<UploadResult> {
  const { uploadURL, objectPath, servingUrl } = await requestUploadUrl(file, purpose, apiOrigin);
  await uploadWithXhr(uploadURL, file, onProgress);
  return { servingUrl, objectPath };
}

/**
 * Delete a file that was previously uploaded.
 * Best-effort: swallows errors so a failed delete never blocks the user.
 * Only fires for Supabase Storage public URLs (skips CDN/external URLs).
 */
export async function deleteStorageFile(
  servingUrl: string,
  apiOrigin = '',
): Promise<void> {
  if (!servingUrl || !servingUrl.includes('/storage/v1/object/public/')) return;
  try {
    await fetch(`${apiOrigin}/api/storage/delete`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servingUrl }),
    });
  } catch {
    // best-effort — never block the upload on a delete failure
  }
}

/** Inline progress bar component styles (Tailwind) */
export function progressBarWidth(percent: number): string {
  return `${Math.max(2, percent)}%`;
}
