import type { SendResult, SyncApi, SyncOperation } from './types';

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current bearer token (JWT), or null when unauthenticated. */
  getToken?: () => string | null;
}

/**
 * The real transport: replays a queued operation against the ASP.NET Core API
 * and normalises the HTTP response into a transport-agnostic {@link SendResult}
 * the engine understands.
 *
 * Mapping:
 *   2xx           → applied (server returns the canonical entity + rowVersion)
 *   409 Conflict  → conflict (body carries the server's current entity)
 *   400/401/403/422 → rejected (poison)
 *   network / 5xx → unavailable (retry later)
 *
 * The operation `id` is sent as an Idempotency-Key header so a retried op after
 * an ambiguous failure is de-duplicated server-side.
 */
export class ApiSyncClient implements SyncApi {
  constructor(private readonly options: ApiClientOptions) {}

  async send(op: SyncOperation): Promise<SendResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Idempotency-Key': op.id,
    };
    const token = this.options.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (op.baseRowVersion != null) headers['If-Match'] = String(op.baseRowVersion);

    let response: Response;
    try {
      response = await fetch(`${this.options.baseUrl}${op.endpoint}`, {
        method: op.method,
        headers,
        body: op.method === 'DELETE' ? undefined : JSON.stringify(op.payload),
      });
    } catch (err) {
      return { outcome: 'unavailable', error: (err as Error)?.message ?? 'network error' };
    }

    if (response.ok) {
      const body = await this.safeJson(response);
      return {
        outcome: 'applied',
        data: body?.data ?? body,
        rowVersion: body?.rowVersion ?? body?.data?.rowVersion,
      };
    }

    if (response.status === 409) {
      const body = await this.safeJson(response);
      return {
        outcome: 'conflict',
        serverEntity: {
          data: body?.data ?? body,
          rowVersion: body?.rowVersion ?? body?.data?.rowVersion ?? 0,
        },
      };
    }

    if (response.status >= 500) {
      return { outcome: 'unavailable', error: `server error ${response.status}` };
    }

    // 4xx other than 409 → permanent rejection.
    const body = await this.safeJson(response);
    return { outcome: 'rejected', error: body?.message ?? `request rejected (${response.status})` };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async safeJson(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
