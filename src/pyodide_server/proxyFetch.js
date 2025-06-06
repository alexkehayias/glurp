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
