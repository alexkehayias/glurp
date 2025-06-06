importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodideReadyPromise = (async () => {
  self.pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
  await self.pyodide.loadPackage(["micropip"]);
  await self.pyodide.runPythonAsync(`
    import micropip
    await micropip.install(["typing-extensions>=4.8.0"])
    await micropip.install(["ssl", "distutils", "setuptools"])
    await micropip.install(["fastapi>=0.110.0"])

    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.get("/hello")
    async def hello():
        return {"msg": "Hello from FastAPI running inside Pyodide!"}

    import asyncio
    from fastapi.responses import Response
    from starlette.types import Scope, Receive, Send

    async def app_asgi(scope, receive, send):
        await app(scope, receive, send)

    async def handle_request(method, path, headers, body):
        # Ensure headers is a Python dict, converting from JsProxy if needed
        if hasattr(headers, 'to_py'):
            headers = headers.to_py()
        headers = {str(k): str(v) for k, v in headers.items()}

        scope = {
            "type": "http",
            "asgi.version": "3.0",
            "asgi.spec_version": "2.1",
            "method": method,
            "path": path,
            "query_string": b"",
            "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
            "client": ("", 0),
            "server": ("", 80),
        }
        body_bytes = body.encode() if isinstance(body, str) else body

        response_data = {"body": b"", "headers": [], "status": 500}
        done_event = asyncio.Event()

        async def receive():
            nonlocal body_bytes
            ret = {"type": "http.request", "body": body_bytes, "more_body": False}
            body_bytes = b""
            return ret

        async def send(message):
            if message["type"] == "http.response.start":
                response_data["status"] = message["status"]
                # Ensure all headers are string tuples
                response_data["headers"] = [
                    (k.decode() if isinstance(k, bytes) else str(k),
                     v.decode() if isinstance(v, bytes) else str(v))
                    for k, v in message["headers"]
                ]
            elif message["type"] == "http.response.body":
                response_data["body"] += message.get("body", b"")
                if not message.get("more_body", False):
                    done_event.set()

        await app_asgi(scope, receive, send)
        await done_event.wait()
        # Decode response body from bytes to string
        if isinstance(response_data["body"], bytes):
            response_data["body"] = response_data["body"].decode("utf-8", errors="replace")

        # Ensure all dict items are JSON serializable types (headers: list of pairs, body: string, status: int)
        # Optionally: sanitize even further if your responses become more complex

        print(f"Returning response_data: {response_data}")
        return response_data
  `);
  self.handle_request = self.pyodide.globals.get('handle_request');
})();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { id, method, path, headers, body } = event.data;
  const result = await self.handle_request(method, path, headers, body);

  if (!result) {
    self.postMessage( {id, error: 'No result returned from Pyodide'});
  }

  let jsResult;
  try {
    jsResult = result.toJs();
  } catch(e) {
    jsResult = { error: 'PyProxy conversion failed', details: (e && e.toString()) || e };
  }

  self.postMessage({
    id,
    status: jsResult.get('status'),
    headers: jsResult.get('headers'),
    body: jsResult.get('body'),
  });
};
