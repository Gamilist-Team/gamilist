// “DB” facade. Later: replace these with real fetch() calls.
// Example: export async function getTrending(){ return fetch('/api/trending').then(r=>r.json()) }

import { games, threads } from './seed';

// pretend latency
const wait = (ms=200) => new Promise(r => setTimeout(r, ms));

export async function getTrending() {
  await wait();
  // naive sort by rating as “trending”
  return [...games].sort((a,b) => b.rating - a.rating).slice(0, 8);
}

export async function getByGenre(genre) {
  await wait();
  return games.filter(g => g.genres.includes(genre)).slice(0, 8);
}

export async function getForumPreview() {
  await wait();
  return threads;
}
