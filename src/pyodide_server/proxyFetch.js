let nextId = 1;
const worker = new Worker(new URL('./worker.js', import.meta.url));
const inflight = new Map();

worker.onmessage = (event) => {
  const { id, ...resp } = event.data;
  const { resolve } = inflight.get(id) || {};
  if (resolve) resolve(resp);
  inflight.delete(id);
};

export async function proxyFetch(path, { method = 'GET', headers = {}, body = '' } = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    inflight.set(id, { resolve, reject });
    worker.postMessage({ id, method, path, headers, body });
  });
}

// A fetch-like function wrapping proxyFetch, returning a web Response-like object
function normalizeHeaders(headers) {
  // Accept Headers, array, or object and produce { key: value, ... }
  let result = {};
  if (!headers) return result;
  if (headers instanceof Headers) {
    headers.forEach((v, k) => { result[k] = v; });
  } else if (Array.isArray(headers)) {
    for (const [k, v] of headers) { result[k] = v; }
  } else if (typeof headers === 'object') {
    result = { ...headers };
  }
  return result;
}

export async function proxyFetchFetch(url, opts = {}) {
  // Only intercept URLs that start with "/" and do not start with "//"
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
    const { method = 'GET', headers, body } = opts;
    const normHeaders = normalizeHeaders(headers);
    const resp = await proxyFetch(url, { method, headers: normHeaders, body });
    // Construct a real Response object
    return new Response(resp.body, {
      status: resp.status,
      headers: resp.headers
    });
  } else {
    // fallback to global fetch
    return fetch(url, opts);
  }
}
