const MLBB_API_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://mlbb.gg/",
  Origin: "https://mlbb.gg",
};

const MLBB_PAGE_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://mlbb.gg/",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mlbbApiFetch<T>(
  url: string,
  retries = 5
): Promise<{ data: T | null; status?: number; error?: string }> {
  let lastStatus: number | undefined;
  let lastError: string | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: MLBB_API_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      lastStatus = res.status;

      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        return { data: null, status: res.status, error: lastError };
      }

      return { data: (await res.json()) as T, status: res.status };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "fetch failed";
      await sleep(400 * (attempt + 1));
    }
  }

  return { data: null, status: lastStatus, error: lastError ?? "max retries exceeded" };
}

export async function mlbbPageFetch(
  url: string,
  retries = 4
): Promise<{ html: string | null; status?: number; error?: string }> {
  let lastStatus: number | undefined;
  let lastError: string | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: MLBB_PAGE_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
      lastStatus = res.status;

      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        return { html: null, status: res.status, error: lastError };
      }

      return { html: await res.text(), status: res.status };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "fetch failed";
      await sleep(400 * (attempt + 1));
    }
  }

  return { html: null, status: lastStatus, error: lastError ?? "max retries exceeded" };
}

export const MLBB_API_BASE = "https://back.mlbb.gg/api/v1";
