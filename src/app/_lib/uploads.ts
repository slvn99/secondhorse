import { promises as fs } from "fs";
import path from "path";
import { put } from "@vercel/blob";

export async function saveImageAndGetUrl(file: File): Promise<string> {
  const inferredExt = (() => {
    const t = (file as any)?.type as string | undefined;
    if (!t) return "";
    const parts = t.split("/");
    return parts.length === 2 ? `.${parts[1]}` : "";
  })();
  const originalName = (file as any)?.name as string | undefined;
  const baseName = originalName && typeof originalName === "string" && originalName.trim().length > 0 ? originalName : `upload${inferredExt || ".bin"}`;
  const safeBase = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamped = `${Date.now()}_${safeBase}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const key = `tfh/${stamped}`;
    const contentType = ((file as any)?.type as string | undefined) || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await put(key, buffer, { access: "public", token, contentType });
    return url;
  }

  if (process.env.NODE_ENV !== "production") {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const dest = path.join(dir, stamped);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dest, buf);
    return `/uploads/${stamped}`;
  }

  throw new Error("Image storage not configured (set BLOB_READ_WRITE_TOKEN)");
}

