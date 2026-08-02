interface NextFetchOptions extends RequestInit {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
}

export class DataSourceError extends Error {
  constructor(
    public readonly source: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DataSourceError";
  }
}

export async function fetchJson<T>(
  source: string,
  url: string,
  init: NextFetchOptions = {},
  timeoutMs = 8_000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "VGIA/0.2 (+https://github.com/hernandez87-byte/VGIA)",
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw new DataSourceError(
        source,
        `${source} respondió ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DataSourceError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Error desconocido";
    throw new DataSourceError(source, message);
  } finally {
    clearTimeout(timeout);
  }
}
