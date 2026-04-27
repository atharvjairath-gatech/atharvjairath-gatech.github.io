const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SpotifyImage = {
  url: string;
};

type SpotifyArtist = {
  name: string;
};

type SpotifyTrack = {
  name: string;
  artists: SpotifyArtist[];
  album: {
    images: SpotifyImage[];
  };
  external_urls: {
    spotify?: string;
  };
};

type SpotifyPlayback = {
  is_playing: boolean;
  item?: SpotifyTrack;
  currently_playing_type?: string;
};

type SpotifyRecentlyPlayed = {
  items: Array<{
    track: SpotifyTrack;
    played_at: string;
  }>;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=20, stale-while-revalidate=40",
    },
  });

async function getAccessToken() {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  const refreshToken = Deno.env.get("SPOTIFY_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify Supabase secrets.");
  }

  const basicToken = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Spotify access token refresh failed.");
  }

  const data = await response.json();
  return data.access_token as string;
}

function toTrackPayload(item: SpotifyTrack) {
  const images = item.album.images || [];
  const albumArt = images[1]?.url || images[0]?.url || images[images.length - 1]?.url || "";

  return {
    title: item.name,
    artists: item.artists.map((artist) => artist.name).join(", "),
    albumArt,
    url: item.external_urls.spotify || "https://open.spotify.com/",
  };
}

function toCurrentTrack(data: SpotifyPlayback) {
  const item = data.item;

  if (!data.is_playing || data.currently_playing_type !== "track" || !item) {
    return null;
  }

  return {
    isPlaying: true,
    source: "current",
    playedAt: null,
    track: toTrackPayload(item),
  };
}

async function getCurrentTrack(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Spotify currently-playing request failed.");
  }

  const data = await response.json() as SpotifyPlayback;
  return toCurrentTrack(data);
}

async function getRecentTrack(accessToken: string) {
  const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Spotify recently-played request failed.");
  }

  const data = await response.json() as SpotifyRecentlyPlayed;
  const recent = data.items?.[0];

  if (!recent?.track) {
    return {
      isPlaying: false,
      source: "none",
      playedAt: null,
      track: null,
    };
  }

  return {
    isPlaying: false,
    source: "recent",
    playedAt: recent.played_at,
    track: toTrackPayload(recent.track),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const accessToken = await getAccessToken();
    const currentTrack = await getCurrentTrack(accessToken);
    return jsonResponse(currentTrack || await getRecentTrack(accessToken));
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Could not load Spotify playback." }, 500);
  }
});
