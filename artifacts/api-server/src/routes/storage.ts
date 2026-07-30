import { Readable } from "stream";
import { z } from "zod";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  ObjectNotFoundError,
  ObjectStorageService,
  StorageNotConfiguredError,
  UploadValidationError,
  validateUpload,
  folderForPurpose,
} from "../lib/objectStorage";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const UploadRequestBody = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  contentType: z.string().min(1),
  /** Optional: controls which folder the file is placed in. */
  purpose: z.string().optional(),
});

const DeleteRequestBody = z.object({
  servingUrl: z.string().url(),
});

/**
 * POST /storage/uploads/request-url
 * Admin-only: returns a presigned Supabase Storage PUT URL.
 * Client uploads the file directly to Supabase, never via this server.
 * Response: { uploadURL, objectPath, servingUrl, metadata }
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = UploadRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "name, size, and contentType are required" });
    return;
  }

  const { name, size, contentType, purpose } = parsed.data;

  try {
    validateUpload(contentType, size);
  } catch (err) {
    if (err instanceof UploadValidationError) {
      res.status(422).json({ error: err.message });
      return;
    }
    throw err;
  }

  const folder = folderForPurpose(purpose);

  try {
    const { uploadURL, objectPath, servingUrl } =
      await objectStorageService.getObjectEntityUploadURL(contentType, folder);

    res.json({ uploadURL, objectPath, servingUrl, metadata: { name, size, contentType } });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      res.status(503).json({ error: err.message });
      return;
    }
    req.log?.error?.({ err }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * DELETE /storage/delete
 * Admin-only: delete a previously-uploaded file from Supabase Storage.
 * Body: { servingUrl: string }
 * Used when an editor replaces or removes an uploaded image/PDF.
 */
router.delete("/storage/delete", requireAuth, async (req: Request, res: Response) => {
  const parsed = DeleteRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "servingUrl is required and must be a valid URL" });
    return;
  }

  try {
    await objectStorageService.deleteObject(parsed.data.servingUrl);
    res.json({ ok: true });
  } catch (err) {
    req.log?.error?.({ err }, "Error deleting storage object");
    res.status(500).json({ error: "Failed to delete object" });
  }
});

/**
 * GET /storage/public-objects/*
 * Backward compat: redirect to Supabase public URL.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = (req.params as any).filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const response = await objectStorageService.downloadObject(`/${filePath}`);
    if (response.status === 302) {
      const loc = response.headers.get("location");
      if (loc) { res.redirect(302, loc); return; }
    }
    res.status(404).json({ error: "File not found" });
  } catch (err) {
    req.log?.error?.({ err }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 * Backward compat: redirect to Supabase public URL.
 * New uploads store the Supabase URL directly so this proxy isn't needed for them.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = (req.params as any).path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const response = await objectStorageService.downloadObject(objectPath);

    if (response.status === 302) {
      const loc = response.headers.get("location");
      if (loc) { res.redirect(302, loc); return; }
    }
    // Fallback: try to stream if somehow it returned a body
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log?.error?.({ err }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
