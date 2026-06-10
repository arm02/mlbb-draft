import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { headers } from "next/headers";

const DATA_DIR = join(process.cwd(), "public", "data");
const BLOB_ACCESS = (process.env.BLOB_ACCESS === "public" ? "public" : "private") as
  | "public"
  | "private";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function useBlob(): boolean {
  return Boolean(blobToken());
}

function localPath(filename: string): string {
  return join(DATA_DIR, filename);
}

function readLocalJsonFile<T>(filename: string): T {
  const path = localPath(filename);
  if (!existsSync(path)) {
    throw new Error(`Missing data file: ${filename}`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

async function getSiteOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    /* not in request context */
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

async function readStaticJsonFile<T>(filename: string): Promise<T> {
  const origin = await getSiteOrigin();
  const res = await fetch(`${origin}/data/${filename}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch static data/${filename} (${res.status})`);
  }
  return (await res.json()) as T;
}

async function readBlobJsonFile<T>(filename: string): Promise<T> {
  const { get } = await import("@vercel/blob");
  const pathname = `data/${filename}`;

  const result = await get(pathname, {
    access: BLOB_ACCESS,
    token: blobToken(),
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Blob not found: ${pathname}`);
  }

  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

export function readJsonFile<T>(filename: string): T {
  return readLocalJsonFile<T>(filename);
}

export async function readJsonFileAsync<T>(filename: string): Promise<T> {
  if (useBlob()) {
    try {
      return await readBlobJsonFile<T>(filename);
    } catch {
      /* fall through to bundled static data */
    }
  }

  try {
    return readLocalJsonFile<T>(filename);
  } catch {
    /* Vercel serverless often has no public/ on disk */
  }

  return readStaticJsonFile<T>(filename);
}

export function writeJsonFile(filename: string, data: unknown): void {
  const path = localPath(filename);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export async function writeJsonFileAsync(filename: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);

  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    await put(`data/${filename}`, content, {
      access: BLOB_ACCESS,
      token: blobToken(),
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  try {
    writeJsonFile(filename, data);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (process.env.VERCEL && code === "EROFS") {
      throw new Error(
        "Cannot write data on Vercel without BLOB_READ_WRITE_TOKEN. Create a Blob store in Vercel dashboard."
      );
    }
    throw err;
  }
}

export function isVercelDeploy(): boolean {
  return Boolean(process.env.VERCEL);
}
