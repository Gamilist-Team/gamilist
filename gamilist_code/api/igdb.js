// api/igdb.js
let tokenCache = { token: null, exp: 0 };

async function getToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.exp - 60_000) return tokenCache.token;

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  url.searchParams.set("client_secret", process.env.TWITCH_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");

  const r = await fetch(url, { method: "POST" });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Twitch auth failed: ${r.status} ${txt}`);
  const data = JSON.parse(txt);
  tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

async function igdb(query, endpoint = "games") {
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
    throw new Error(`IGDB ${endpoint} ${r.status}`);
  }
  return JSON.parse(txt);
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
export async function getTrendingGames(limit = 20, popularityTypeId = 1 /* Visits */) {
  // 1) get top game_ids from popularity_primitives
  const primitives = await igdb(
    `fields game_id,value,popularity_type;
     where popularity_type = ${popularityTypeId};
     sort value desc;
     limit ${limit};`,
    "popularity_primitives"
  );

  const ids = primitives.map(p => p.game_id).filter(Boolean);
  if (!ids.length) return [];

  // 2) fetch those games
  const games = await igdb(
    `fields id,name,cover.image_id,artworks.image_id,total_rating,total_rating_count;
     where id = (${ids.join(",")});
     limit ${ids.length};`,
    "games"
  );

  // 3) keep PopScore order
  const byId = new Map(games.map(g => [g.id, g]));
  return primitives.map(p => byId.get(p.game_id)).filter(Boolean).map(toCard);
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
    genres: (g.genres || []).map(x => x.name),
    releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000).toISOString() : null,
    screenshots: (g.screenshots || []).map(s => img(s.image_id, "screenshot_big")).filter(Boolean),
  };
}
