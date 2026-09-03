export type HistoryState = 'empty' | 'unavailable' | 'signed_out' | 'forbidden';

/** Empty-state-only client. Tokens and returned records never enter UI state. */
export function createGuestHistoryClient(deps: {
  baseUrl: string;
  allowLocalHttp: boolean;
  session: () => Promise<{ token: string; sub: string } | null>;
  fetcher: typeof fetch;
  timeoutMs?: number;
}) {
  return async (signal: AbortSignal): Promise<HistoryState> => {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const base = new URL(deps.baseUrl);
      if (base.username || base.password || base.search || base.hash ||
          (base.protocol !== 'https:' && !(deps.allowLocalHttp && base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) return 'unavailable';
      const run = async (): Promise<HistoryState> => {
        const session = await deps.session();
        if (!session) return 'signed_out';
        if (signal.aborted || controller.signal.aborted) return 'unavailable';
        const response = await deps.fetcher(`${base.origin}/api/my-bookings`, {
          headers: { Authorization: `Bearer ${session.token}` },
          signal: controller.signal, redirect: 'error', cache: 'no-store',
        });
        if (response.status === 401) return 'signed_out';
        if (response.status === 403) return 'forbidden';
        if (!response.ok) return 'unavailable';
        const body: unknown = await response.json();
        // Never silently discard real records and claim there are no stays.
        if (!body || typeof body !== 'object' || !('bookings' in body) || !Array.isArray(body.bookings) || body.bookings.length !== 0) return 'unavailable';
        const current = await deps.session();
        if (!current || current.sub !== session.sub) return 'signed_out';
        return 'empty';
      };
      return await Promise.race([run(), new Promise<HistoryState>(resolve => {
        timer = setTimeout(() => { controller.abort(); resolve('unavailable'); }, deps.timeoutMs ?? 10000);
      })]);
    } catch { return 'unavailable'; }
    finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
  };
}
