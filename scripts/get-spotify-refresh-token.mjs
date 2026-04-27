import http from "node:http";
import { Buffer } from "node:buffer";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/api/spotify/callback";
const scopes = ["user-read-currently-playing", "user-read-playback-state", "user-read-recently-played"];

if (!clientId || !clientSecret) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET before running this helper.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.search = new URLSearchParams({
  client_id: clientId,
  response_type: "code",
  redirect_uri: redirectUri,
  scope: scopes.join(" "),
  state: Math.random().toString(36).slice(2),
}).toString();

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", redirectUri);

  if (requestUrl.pathname !== "/api/spotify/callback") {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    response.writeHead(400);
    response.end("Missing Spotify code.");
    return;
  }

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(JSON.stringify(tokens, null, 2));
    }

    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Spotify connected. You can close this tab and copy the refresh token from the terminal.");
    console.log("\nSPOTIFY_REFRESH_TOKEN=");
    console.log(tokens.refresh_token);
    console.log("\nSet this as a Supabase secret, then deploy the function.");
  } catch (error) {
    response.writeHead(500);
    response.end("Could not exchange Spotify code. Check the terminal.");
    console.error(error);
  } finally {
    server.close();
  }
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Open this URL to authorize Spotify:\n");
  console.log(authUrl.toString());
});
