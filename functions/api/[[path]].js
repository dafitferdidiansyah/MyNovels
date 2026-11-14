export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  const BACKEND_ORIGIN = "https://playset-setting-supermom.ngrok-free.dev";
  const targetUrl = new URL(url.pathname + url.search, BACKEND_ORIGIN);

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("ngrok-skip-browser-warning", "69420");
  reqHeaders.set("Host", targetUrl.host);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const isDownload = url.pathname.includes("/download/");

  const fetchOptions = {
    method: request.method,
    headers: reqHeaders,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    redirect: "follow",
  };

  if (isDownload && request.method === "GET") {
    fetchOptions.cf = {
      cacheTtl: 604800,
      cacheEverything: true,
    };
  }

  const response = await fetch(targetUrl.toString(), fetchOptions);

  const respHeaders = new Headers(response.headers);
  if (isDownload && response.ok) {
    respHeaders.set("Cache-Control", "public, max-age=604800, s-maxage=604800, immutable");
  } else {
    respHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
  }

  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  respHeaders.set("Access-Control-Allow-Headers", "*");
  respHeaders.set("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}
