import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function sniffExt(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ".png";
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) return ".jpg";
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return ".gif";
  // WEBP (RIFF....WEBP)
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return ".webp";
  return null;
}

export async function saveImageAndGetUrl(file: File): Promise<string> {
  const size = (file as any)?.size as number | undefined;
  if (!size || size <= 0) throw new Error("Empty file");
  if (size > MAX_BYTES) throw new Error("File too large");

  const type = (file as any)?.type as string | undefined;
  if (!type || !ALLOWED_MIME.has(type)) throw new Error("Unsupported file type");

  const buf = Buffer.from(await file.arrayBuffer());
  const extFromMagic = sniffExt(buf);
  const ext = extFromMagic || (type === "image/jpeg" ? ".jpg" : type === "image/png" ? ".png" : type === "image/webp" ? ".webp" : type === "image/gif" ? ".gif" : ".bin");
  const stamped = `${Date.now()}_${randomUUID()}${ext}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const key = `tfh/${stamped}`;
    const contentType = type || "application/octet-stream";
    const { url } = await put(key, buf, { access: "public", token, contentType });
    return url;
  }

  if (process.env.NODE_ENV !== "production") {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const dest = path.join(dir, stamped);
    await fs.writeFile(dest, buf);
    return `/uploads/${stamped}`;
  }

  throw new Error("Image storage not configured (set BLOB_READ_WRITE_TOKEN)");
}
