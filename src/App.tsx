import { FormEvent, useState } from 'react';

type AnimeSearchResult = {
  mal_id: number;
  title: string;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
  genres?: Array<{ mal_id: number; name: string }>;
  studios?: Array<{ mal_id: number; name: string }>;
};

type AnimeDetails = {
  mal_id: number;
  title: string;
  synopsis?: string;
  score?: number;
  genres: Array<{ mal_id: number; name: string }>;
  studios: Array<{ mal_id: number; name: string }>;
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
};

type RecommendationEntry = {
  entry: AnimeSearchResult;
  votes: number;
};

type JikanResponse<T> = {
  data: T;
};

const JIKAN_BASE = 'https://api.jikan.moe/v4';
const MAL_SEARCH_PROXY = '/mal-search/anime.php';

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function searchAnimeSeed(query: string): Promise<AnimeSearchResult | undefined> {
  const html = await fetch(`${MAL_SEARCH_PROXY}?q=${encodeURIComponent(query)}&cat=anime`).then((response) => {
    if (!response.ok) {
      throw new Error(`MAL search failed with status ${response.status}`);
    }

    return response.text();
  });

  const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
  const matches = Array.from(parsedDocument.querySelectorAll<HTMLAnchorElement>('a[data-l-content-id][href*="/anime/"]'))
    .map((anchor) => {
      const href = anchor.getAttribute('href');

      if (!href) {
        return null;
      }

      const url = new URL(href);
      const parts = url.pathname.split('/').filter(Boolean);
      const id = Number(parts[1]);
      const slug = parts.slice(2).join('/').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

      return Number.isFinite(id)
        ? {
            mal_id: id,
            title: slug,
          }
        : null;
    })
    .filter((item): item is AnimeSearchResult => item !== null);

  const normalizedQuery = normalize(query);

  return (
    matches.find((anime) => {
      const normalizedTitle = normalize(anime.title);
      return normalizedTitle === normalizedQuery || normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle);
    }) ?? matches[0]
  );
}

async function fetchJsonWithRetry<T>(url: string, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchJson<T>(url);
    } catch (error) {
      lastError = error;

      if (!(error instanceof Error) || !/status 429|status 5\d\d/.test(error.message)) {
        throw error;
      }

      if (attempt < attempts - 1) {
        await delay(1500 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed after retries.');
}

async function fetchAnimeDetails(id: number): Promise<AnimeDetails> {
  const payload = await fetchJson<JikanResponse<AnimeDetails>>(`${JIKAN_BASE}/anime/${id}`);
  return payload.data;
}

async function fetchAnimeRecommendations(id: number): Promise<RecommendationEntry[]> {
  const payload = await fetchJsonWithRetry<JikanResponse<RecommendationEntry[]>>(
    `${JIKAN_BASE}/anime/${id}/recommendations`,
  );
  return payload.data;
}

async function fetchGenrePicks(genreIds: number[]): Promise<AnimeSearchResult[]> {
  if (genreIds.length === 0) {
    return [];
  }

  const payload = await fetchJson<JikanResponse<AnimeSearchResult[]>>(
    `${JIKAN_BASE}/anime?genres=${genreIds.join(',')}&sort=desc&order_by=score&limit=6&sfw=true`,
  );

  return payload.data;
}

export default function App() {
  const [seed, setSeed] = useState('The Witch from Mercury');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedAnime, setSeedAnime] = useState<AnimeSearchResult | null>(null);
  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationEntry[]>([]);
  const [genrePicks, setGenrePicks] = useState<AnimeSearchResult[]>([]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = seed.trim();

    if (!query) {
      setError('Enter an anime title to search.');
      return;
    }

    setLoading(true);
    setError(null);
    setSeedAnime(null);
    setDetails(null);
    setRecommendations([]);
    setGenrePicks([]);

    try {
      const matchedAnime = await searchAnimeSeed(query);

      if (!matchedAnime) {
        throw new Error('No anime match found for that seed.');
      }

      const animeDetails = await fetchAnimeDetails(matchedAnime.mal_id);
      const recommendationData = await fetchAnimeRecommendations(matchedAnime.mal_id);
      let nichePicks: AnimeSearchResult[] = [];

      try {
        nichePicks = await fetchGenrePicks(animeDetails.genres.map((genre) => genre.mal_id));
      } catch (genreError) {
        console.warn('Genre-based niche query failed:', genreError);
      }

      console.log('Seed anime:', matchedAnime);
      console.log('Anime details:', animeDetails);
      console.log('Raw recommendation data:', recommendationData);
      console.log('Genre-based niche picks:', nichePicks);

      setSeedAnime(matchedAnime);
      setDetails(animeDetails);
      setRecommendations(recommendationData);
      setGenrePicks(nichePicks);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Something went wrong while fetching anime data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Anime Discovery Tool</span>
          <h1>Search a seed anime, resolve its MAL ID, and print recommendations straight to the console.</h1>
          <p>
            Start with a familiar title like <strong>The Witch from Mercury</strong> or <strong>Clannad</strong>,
            then let Jikan do the lookups.
          </p>
        </div>

        <form className="search-card" onSubmit={handleSubmit}>
          <label htmlFor="seed">Seed anime</label>
          <div className="search-row">
            <input
              id="seed"
              type="text"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              placeholder="Search for a title"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Resolving...' : 'Discover'}
            </button>
          </div>
          <p className="helper-text">Searches the title, fetches the MAL ID, then pulls recommendations and niche picks.</p>
        </form>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="results-grid">
        <article className="panel">
          <h2>Seed lookup</h2>
          {seedAnime ? (
            <div className="seed-summary">
              <img src={seedAnime.images?.jpg?.image_url} alt={seedAnime.title} />
              <div>
                <h3>{seedAnime.title}</h3>
                <p>MAL ID: {seedAnime.mal_id}</p>
              </div>
            </div>
          ) : (
            <p className="empty-state">Your resolved anime will appear here.</p>
          )}
        </article>

        <article className="panel">
          <h2>Anime details</h2>
          {details ? (
            <div className="detail-stack">
              <p>{details.synopsis ?? 'No synopsis available.'}</p>
              <p>
                <strong>Genres:</strong> {details.genres.map((genre) => genre.name).join(', ') || 'None'}
              </p>
              <p>
                <strong>Studios:</strong> {details.studios.map((studio) => studio.name).join(', ') || 'Unknown'}
              </p>
            </div>
          ) : (
            <p className="empty-state">Genre and studio data will appear after lookup.</p>
          )}
        </article>

        <article className="panel">
          <h2>Recommendation engine</h2>
          {recommendations.length > 0 ? (
            <ul className="result-list">
              {recommendations.slice(0, 5).map((item) => (
                <li key={item.entry.mal_id}>
                  <span>{item.entry.title}</span>
                  <small>{item.votes} votes</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Recommendation payload will print to the console and show a preview here.</p>
          )}
        </article>

        <article className="panel wide">
          <h2>Genre-based niche picks</h2>
          {genrePicks.length > 0 ? (
            <div className="card-row">
              {genrePicks.slice(0, 4).map((anime) => (
                <div key={anime.mal_id} className="mini-card">
                  <strong>{anime.title}</strong>
                  <span>MAL ID {anime.mal_id}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">This secondary query surfaces highly rated shows from the same genre mix.</p>
          )}
        </article>
      </section>
    </main>
  );
}
