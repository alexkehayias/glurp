import * as React from 'react';
import MonacoEditor from "./CodeEditor";
import Repl from "./Repl";
import { EvalProvider } from './EvalContext';
import { proxyFetch, proxyFetchFetch } from "./pyodide_server/proxyFetch";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ThemeProvider } from "@/components/ui/theme-provider";


defineBrowserFetchProxy();

function headersToObject(headers: HeadersInit | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  } else if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } else {
    // If it's already a plain object
    return headers;
  }
}

function defineBrowserFetchProxy() {
  const globalObj = typeof window !== "undefined" ? window : self;
  const realFetch: typeof fetch = globalObj.fetch.bind(globalObj);
  globalObj.fetch = (async function(url: RequestInfo | URL, opts?: RequestInit): Promise<Response> {
    // Only proxy fetches with path-only URLs (no host, starts with / but not //)
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
      const { headers, ...rest } = opts ?? {};
      const normHeaders = headersToObject(headers);
      const proxyResponse = await proxyFetchFetch(url, { ...rest, headers: normHeaders });
      const responseHeaders = proxyResponse.headers ? Object.fromEntries(proxyResponse.headers) : undefined;
      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        headers: responseHeaders,
      });
    }
    return realFetch(url, opts);
  }) as typeof fetch;
}

export default function App() {
  const callPyodideServer = React.useCallback(async () => {
    const resp = await fetch("/hello", { method: "GET", headers: {} });
    const body = await resp.json();
    alert(`FastAPI responded: ${resp.status} - ${body.msg}`);
  }, []);

  return (
    <EvalProvider>
      <ThemeProvider>
      <DashboardLayout>
        <div id="app-root" className="flex h-full min-h-0 min-w-0">
          <div id="monaco-root" className="flex flex-col flex-1 min-w-0 relative">
            <MonacoEditor />
          </div>
          <div id="terminal-root" className="flex flex-col flex-1 min-w-0 relative">
            <Repl />
          </div>
        </div>
      </DashboardLayout>
    </ThemeProvider>
    </EvalProvider>
  );
}
