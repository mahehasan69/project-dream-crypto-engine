/**
 * Minimal Matrix Client-Server API transport for the Matrix Rust Crypto
 * state machine. This is a protocol transport layer, not a complete Matrix
 * client and not yet wired to Project Dream's Worker.
 *
 * Access tokens are held in memory only. Do not persist them in localStorage,
 * IndexedDB, URLs, logs, or error messages.
 */

export interface MatrixTransportOptions {
  homeserverUrl: string;
  accessToken?: string;
  fetchImpl?: typeof fetch;
}

export class MatrixHttpError extends Error {
  constructor(
    readonly status: number,
    readonly errcode: string | undefined,
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "MatrixHttpError";
  }
}

export interface MatrixWhoAmI {
  user_id: string;
  device_id?: string;
  is_guest?: boolean;
}

export interface MatrixDevice {
  device_id: string;
  display_name?: string;
  last_seen_ts?: number;
  last_seen_ip?: string;
}

export interface MatrixDevicesResponse {
  devices: MatrixDevice[];
}

export interface MatrixKeyUploadResponse {
  one_time_key_counts?: Record<string, number>;
  unused_fallback_key_types?: string[];
}

export interface MatrixKeyClaimResponse {
  failures?: Record<string, unknown>;
  one_time_keys?: Record<string, Record<string, Record<string, unknown>>>;
}

export interface MatrixSyncResponse {
  next_batch: string;
  device_one_time_keys_count?: Record<string, number>;
  device_unused_fallback_key_types?: string[];
  to_device?: { events?: Array<{ type: string; sender: string; content: Record<string, unknown> }> };
  device_lists?: { changed?: string[]; left?: string[] };
  rooms?: Record<string, unknown>;
}

export interface MatrixTransport {
  whoami(): Promise<MatrixWhoAmI>;
  devices(): Promise<MatrixDevicesResponse>;
  queryKeys(deviceKeys: Record<string, string[]>): Promise<Record<string, unknown>>;
  uploadKeys(payload: Record<string, unknown>): Promise<MatrixKeyUploadResponse>;
  claimKeys(oneTimeKeys: Record<string, Record<string, string>>): Promise<MatrixKeyClaimResponse>;
  sync(options?: { since?: string; timeoutMs?: number }): Promise<MatrixSyncResponse>;
  sendToDevice(eventType: string, txnId: string, messages: Record<string, Record<string, unknown>>): Promise<void>;
  sendRoomEvent(roomId: string, eventType: string, txnId: string, content: Record<string, unknown>): Promise<{ event_id: string }>;
}

const MATRIX_PREFIX = "/_matrix/client/v3";

function requiredSegment(value: string, label: string): string {
  if (!value || !value.trim()) throw new TypeError(label + " must not be empty.");
  return encodeURIComponent(value);
}

function safeHomeserver(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new TypeError("Homeserver URL must use HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError("Homeserver URL must not contain credentials, query, or fragment.");
  }
  return url;
}

export class MatrixHttpTransport implements MatrixTransport {
  private readonly base: URL;
  private readonly fetcher: typeof fetch;
  private accessToken?: string;

  constructor(options: MatrixTransportOptions) {
    this.base = safeHomeserver(options.homeserverUrl);
    this.fetcher = options.fetchImpl ?? fetch;
    this.accessToken = options.accessToken;
  }

  /** Replace or clear the in-memory bearer token after login/logout. */
  setAccessToken(token?: string): void {
    this.accessToken = token?.trim() || undefined;
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!path.startsWith(MATRIX_PREFIX + "/")) throw new TypeError("Invalid Matrix API path.");
    const url = new URL(path, this.base);
    if (url.origin !== this.base.origin) throw new TypeError("Matrix API request escaped homeserver origin.");

    const headers = new Headers({ Accept: "application/json" });
    if (this.accessToken) headers.set("Authorization", "Bearer " + this.accessToken);
    if (body !== undefined) headers.set("Content-Type", "application/json");

    const response = await this.fetcher(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    });

    if (!response.ok) {
      let data: Record<string, unknown> = {};
      try { data = await response.json() as Record<string, unknown>; } catch { /* response may not be JSON */ }
      const retry = response.headers.get("retry-after");
      const retryAfterMs = retry && Number.isFinite(Number(retry)) ? Number(retry) * 1000 : undefined;
      throw new MatrixHttpError(
        response.status,
        typeof data.errcode === "string" ? data.errcode : undefined,
        typeof data.error === "string" ? data.error : "Matrix request failed.",
        retryAfterMs,
      );
    }

    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  whoami(): Promise<MatrixWhoAmI> {
    return this.request("GET", MATRIX_PREFIX + "/account/whoami");
  }

  devices(): Promise<MatrixDevicesResponse> {
    return this.request("GET", MATRIX_PREFIX + "/devices");
  }

  queryKeys(deviceKeys: Record<string, string[]>): Promise<Record<string, unknown>> {
    return this.request("POST", MATRIX_PREFIX + "/keys/query", { device_keys: deviceKeys });
  }

  uploadKeys(payload: Record<string, unknown>): Promise<MatrixKeyUploadResponse> {
    return this.request("POST", MATRIX_PREFIX + "/keys/upload", payload);
  }

  claimKeys(oneTimeKeys: Record<string, Record<string, string>>): Promise<MatrixKeyClaimResponse> {
    return this.request("POST", MATRIX_PREFIX + "/keys/claim", { one_time_keys: oneTimeKeys });
  }

  sync(options: { since?: string; timeoutMs?: number } = {}): Promise<MatrixSyncResponse> {
    const query = new URLSearchParams();
    if (options.since) query.set("since", options.since);
    if (options.timeoutMs !== undefined) {
      if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 0 || options.timeoutMs > 120_000) {
        throw new RangeError("timeoutMs must be an integer from 0 to 120000.");
      }
      query.set("timeout", String(options.timeoutMs));
    }
    const suffix = query.size ? "?" + query.toString() : "";
    return this.request("GET", MATRIX_PREFIX + "/sync" + suffix);
  }

  sendToDevice(
    eventType: string,
    txnId: string,
    messages: Record<string, Record<string, unknown>>,
  ): Promise<void> {
    return this.request(
      "PUT",
      MATRIX_PREFIX + "/sendToDevice/" + requiredSegment(eventType, "eventType") + "/" + requiredSegment(txnId, "txnId"),
      { messages },
    );
  }

  sendRoomEvent(
    roomId: string,
    eventType: string,
    txnId: string,
    content: Record<string, unknown>,
  ): Promise<{ event_id: string }> {
    return this.request(
      "PUT",
      MATRIX_PREFIX + "/rooms/" + requiredSegment(roomId, "roomId") + "/send/" +
        requiredSegment(eventType, "eventType") + "/" + requiredSegment(txnId, "txnId"),
      content,
    );
  }
}
