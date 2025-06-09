export interface ProxyFetchResponse {
  status: number;
  headers: [string, string][];
  body: string;
}
export function proxyFetch(
  path: string,
  opts?: { method?: string; headers?: Record<string, string>; body?: any }
): Promise<ProxyFetchResponse>;

export function proxyFetchFetch(
  url: string,
  opts?: { method?: string; headers?: Record<string, string>; body?: any }
): Promise<ProxyFetchResponse>;
