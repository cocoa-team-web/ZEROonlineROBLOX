const ROBLOX = "https://games.roblox.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "Only GET is allowed" }, 405);
    }

    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");
    const cursor = url.searchParams.get("cursor");

    if (!placeId || !/^\d+$/.test(placeId)) {
      return json({ error: "placeId must contain digits only" }, 400);
    }

    const api = new URL(`${ROBLOX}/v1/games/${placeId}/servers/Public`);
    api.searchParams.set("sortOrder", "Asc");
    api.searchParams.set("limit", "50");
    api.searchParams.set("excludeFullGames", "true");
    if (cursor) api.searchParams.set("cursor", cursor);

    try {
      const upstream = await fetch(api.toString(), {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Roblox-Empty-Server-Finder/1.0"
        }
      });

      const text = await upstream.text();

      if (!upstream.ok) {
        return new Response(text || JSON.stringify({
          error: `Roblox API returned HTTP ${upstream.status}`
        }), {
          status: upstream.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        });
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return json({ error: "Roblox returned invalid JSON" }, 502);
      }

      return json({
        data: Array.isArray(data.data) ? data.data : [],
        nextPageCursor: data.nextPageCursor ?? null,
        previousPageCursor: data.previousPageCursor ?? null
      });
    } catch (error) {
      return json({ error: `Proxy error: ${error.message}` }, 502);
    }
  }
};
