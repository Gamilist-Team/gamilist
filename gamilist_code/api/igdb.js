// api/igdb.js
let tokenCache = { token: null, exp: 0 };

async function getToken(retries = 3) {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.exp - 60_000)
    return tokenCache.token;

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", process.env.TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, { method: "POST" });
      const txt = await r.text();
      if (!r.ok) throw new Error(`Twitch auth failed: ${r.status} ${txt}`);
      const data = JSON.parse(txt);
      tokenCache = {
        token: data.access_token,
        exp: Date.now() + data.expires_in * 1000,
      };
      return tokenCache.token;
    } catch (error) {
      console.error(
        `Token fetch attempt ${attempt + 1} failed:`,
        error.message
      );
      if (attempt === retries - 1) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

async function igdb(query, endpoint = "games", retries = 2) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const token = await getToken();
      const r = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
        method: "POST",
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/plain",
        },
        body: query,
      });
      const txt = await r.text();
      if (!r.ok) {
        console.error(`IGDB ${endpoint} ${r.status}:`, txt);
        // If token expired, clear cache and retry
        if (r.status === 401 && attempt < retries - 1) {
          tokenCache = { token: null, exp: 0 };
          continue;
        }
        throw new Error(`IGDB ${endpoint} ${r.status}`);
      }
      return JSON.parse(txt);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.error(
        `IGDB ${endpoint} attempt ${attempt + 1} failed:`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

const img = (id, size = "t_cover_big") =>
  id ? `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg` : null;

const toCard = (g) => {
  const coverId = g.cover?.image_id;
  const heroId = g.artworks?.[0]?.image_id || coverId;
  return {
    id: g.id,
    title: g.name,
    rating: g.total_rating ?? null,
    ratingCount: g.total_rating_count ?? null,
    cover: img(coverId, "t_cover_big"),
    hero: img(heroId, "t_1080p"),
  };
};

// ---------- TRENDING via PopScore (popularity_primitives) ----------
export async function getTrendingGames(
  limit = 20,
  popularityTypeId = 1 /* Visits */
) {
  // 1) get top game_ids from popularity_primitives
  const primitives = await igdb(
    `fields game_id,value,popularity_type;
     where popularity_type = ${popularityTypeId};
     sort value desc;
     limit ${limit};`,
    "popularity_primitives"
  );

  const ids = primitives.map((p) => p.game_id).filter(Boolean);
  if (!ids.length) return [];

  // 2) fetch those games
  const games = await igdb(
    `fields id,name,cover.image_id,artworks.image_id,total_rating,total_rating_count;
     where id = (${ids.join(",")});
     limit ${ids.length};`,
    "games"
  );

  // 3) keep PopScore order
  const byId = new Map(games.map((g) => [g.id, g]));
  return primitives
    .map((p) => byId.get(p.game_id))
    .filter(Boolean)
    .map(toCard);
}

// ---------- BY GENRE (no deprecated fields) ----------
// api/igdb.js

export async function getByGenreName(name) {
  // 1) Try an exact name match
  let rows = await igdb(
    `fields id,name,slug;
     where name = "${name}";
     limit 1;`,
    "genres"
  );

  // 2) If not found, try by slug (e.g., "Action RPG" -> "action-rpg")
  let genre = rows[0];
  if (!genre) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    rows = await igdb(
      `fields id,name,slug;
       where slug = "${slug}";
       limit 1;`,
      "genres"
    );
    genre = rows[0];
  }
  if (!genre) return [];

  // 3) Fetch games in that genre, sorted by a supported signal
  const games = await igdb(
    `fields id,name,cover.image_id,artworks.image_id,total_rating,total_rating_count,genres;
     where cover != null & genres = (${genre.id});
     sort total_rating_count desc;
     limit 20;`,
    "games"
  );

  return games.map(toCard);
}

// ---------- SINGLE GAME ----------
export async function getGameById(id) {
  const rows = await igdb(
    `fields id,name,summary,cover.image_id,artworks.image_id,total_rating,total_rating_count,
            genres.name,first_release_date,screenshots.image_id;
     where id = ${Number(id)};
     limit 1;`,
    "games"
  );
  const g = rows[0];
  if (!g) return null;
  return {
    ...toCard(g),
    summary: g.summary ?? "",
    genres: (g.genres || []).map((x) => x.name),
    releaseDate: g.first_release_date
      ? new Date(g.first_release_date * 1000).toISOString()
      : null,
    screenshots: (g.screenshots || [])
      .map((s) => img(s.image_id, "screenshot_big"))
      .filter(Boolean),
  };
}

// ---------- SEARCH ----------
export async function searchGames(query, limit = 20) {
  if (!query || query.trim().length < 2) return [];

  const games = await igdb(
    `search "${query}";
     fields id,name,cover.image_id,artworks.image_id,total_rating,total_rating_count;
     where cover != null;
     limit ${limit};`,
    "games"
  );

  return games.map(toCard);
}
