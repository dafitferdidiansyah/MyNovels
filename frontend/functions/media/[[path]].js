export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Target backend running on Proxmox via Ngrok
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
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  // Cloudflare CDN edge cache for images/covers (30 days)
  const fetchOptions = {
    method: request.method,
    headers: reqHeaders,
    redirect: "follow",
    cf: {
      cacheTtl: 2592000, // 30 days on Cloudflare Edge
      cacheEverything: true,
    },
  };

  const response = await fetch(targetUrl.toString(), fetchOptions);

  const respHeaders = new Headers(response.headers);
  if (response.ok) {
    respHeaders.set("Cache-Control", "public, max-age=2592000, s-maxage=2592000, immutable");
  }
  respHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}
