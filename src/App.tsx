import { type FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Info,
  Play,
  Search,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';

import navLogo from './assets/ADT_Project_2026_Logo_Zoomed.png';
import heroLogo from './assets/ADT_Project_2026_Logo.png';

type AnimeGenre = {
  mal_id: number;
  name: string;
};

type AnimeImages = {
  webp?: {
    large_image_url?: string;
  };
};

type AnimeTrailer = {
  url?: string;
  embed_url?: string;
};

type AnimeItem = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  score?: number | null;
  rank?: number | null;
  year?: number | null;
  episodes?: number | null;
  status?: string | null;
  type?: string | null;
  rating?: string | null;
  synopsis?: string | null;
  genres?: AnimeGenre[];
  images: AnimeImages;
  trailer?: AnimeTrailer;
};

type RelationEntry = {
  mal_id: number;
  type: string;
  name: string;
  url: string;
};

type AnimeRelation = {
  relation: string;
  entry: RelationEntry[];
};

type RecommendationEntry = {
  entry: AnimeItem;
  votes: number;
};

type JikanResponse<T> = {
  data: T;
};

type NavbarProps = {
  onSearch: (query: string) => void;
  onHomeClick: () => void;
};

type HeroProps = {
  anime: AnimeItem;
  onSelect: (anime: AnimeItem) => void;
};

type AnimeCardProps = {
  anime: AnimeItem;
  onSelect: (anime: AnimeItem) => void;
};

type AnimeDetailsProps = {
  anime: AnimeItem | null;
  onBack: () => void;
  recommendations: RecommendationEntry[];
  relations: AnimeRelation[];
  onRecommendationSelect: (anime: AnimeItem) => void;
};

type ViewState = 'home' | 'search' | 'details';

const JIKAN_API_BASE = 'https://api.jikan.moe/v4';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const fetchTopAnime = async (): Promise<JikanResponse<AnimeItem[]>> => {
  return fetchJson<JikanResponse<AnimeItem[]>>(`${JIKAN_API_BASE}/top/anime?limit=15`);
};

const fetchSeasonAnime = async (): Promise<JikanResponse<AnimeItem[]>> => {
  return fetchJson<JikanResponse<AnimeItem[]>>(`${JIKAN_API_BASE}/seasons/now?limit=15`);
};

const fetchAnimeDetails = async (id: number): Promise<JikanResponse<AnimeItem>> => {
  return fetchJson<JikanResponse<AnimeItem>>(`${JIKAN_API_BASE}/anime/${id}`);
};

const fetchAnimeRelations = async (id: number): Promise<JikanResponse<AnimeRelation[]>> => {
  return fetchJson<JikanResponse<AnimeRelation[]>>(`${JIKAN_API_BASE}/anime/${id}/relations`);
};

const fetchAnimeRecommendations = async (id: number): Promise<JikanResponse<RecommendationEntry[]>> => {
  return fetchJson<JikanResponse<RecommendationEntry[]>>(`${JIKAN_API_BASE}/anime/${id}/recommendations`);
};

const searchAnime = async (query: string): Promise<JikanResponse<AnimeItem[]>> => {
  return fetchJson<JikanResponse<AnimeItem[]>>(
    `${JIKAN_API_BASE}/anime?q=${encodeURIComponent(query)}&sfw=true&order_by=popularity&sort=asc&limit=20`,
  );
};

const getImageUrl = (anime: AnimeItem) => anime.images.webp?.large_image_url ?? '';

const normalizeAnime = (anime: AnimeItem): AnimeItem => ({
  ...anime,
  images: anime.images ?? {},
});

const formatSynopsis = (text?: string | null) => {
  if (!text) return null;
  return text.replace(/\[Written by MAL Rewrite\]/gi, '').trim();
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal-500 border-t-2 border-t-orange-500" />
  </div>
);

const EmptySection = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <p className="mx-auto mt-2 max-w-xl text-slate-400">{description}</p>
  </div>
);

const Navbar = ({ onSearch, onHomeClick }: NavbarProps) => {
  const [query, setQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/90 py-3 shadow-lg backdrop-blur-md' : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 md:px-8">
        <div className="group flex cursor-pointer items-center gap-3" onClick={onHomeClick}>
          <img 
            src={heroLogo}
            alt="Logo" 
            className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-teal-900/50 transition-transform group-hover:scale-105" 
          />
          <span className="hidden bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-xl font-bold text-transparent sm:block">
            AniWhere
          </span>
        </div>

        <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search anime..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-800/80 py-2.5 pl-12 pr-10 text-white transition-all placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </nav>
  );
};

const Hero = ({ anime, onSelect }: HeroProps) => {
  return (
    <div className="relative flex h-[70vh] min-h-[500px] w-full items-end pb-20">
      <div className="absolute inset-0 z-0">
        <img
          src={getImageUrl(anime)}
          alt={anime.title}
          className="h-full w-full object-cover opacity-40 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-end gap-8 px-4 md:flex-row md:items-end md:px-8">
        <div className="hidden w-48 shrink-0 overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl shadow-teal-500/20 md:block lg:w-64">
          <img src={getImageUrl(anime)} alt={anime.title} className="h-auto w-full object-cover" />
        </div>

        <div className="max-w-3xl flex-1">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              #1 Trending
            </span>
            {anime.score ? (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold text-white">{anime.score}</span>
              </div>
            ) : null}
          </div>

          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            {anime.title_english || anime.title}
          </h1>

          <p className="whitespace-pre-wrap mb-8 text-lg leading-relaxed text-slate-300 line-clamp-3 md:line-clamp-4">
            {formatSynopsis(anime.synopsis) ?? 'No synopsis available.'}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onSelect(anime)}
              className="flex items-center gap-2 rounded-full bg-teal-600 px-8 py-3 font-semibold text-white shadow-lg shadow-teal-600/30 transition-all hover:scale-105 hover:bg-teal-500 active:scale-95"
            >
              <Info className="h-5 w-5" />
              More Details
            </button>
            {anime.trailer?.url ? (
              <a
                href={anime.trailer.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-8 py-3 font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-700"
              >
                <Play className="h-5 w-5" />
                Watch Trailer
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const AnimeCard = ({ anime, onSelect }: AnimeCardProps) => (
  <div
    onClick={() => onSelect(anime)}
    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all duration-300 hover:-translate-y-2 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/20"
  >
    <div className="relative aspect-[3/4] overflow-hidden bg-slate-800">
      <img
        src={getImageUrl(anime)}
        alt={anime.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {anime.score ? (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-900/80 px-2.5 py-1 backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-current text-yellow-400" />
          <span className="text-sm font-bold text-white">{anime.score}</span>
        </div>
      ) : null}

      <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="rounded-full bg-teal-600 p-3 text-white shadow-lg">
          <Play className="h-5 w-5 fill-current" />
        </div>
      </div>
    </div>

    <div className="flex flex-1 flex-col justify-between p-4">
      <div>
        <h3 className="line-clamp-1 font-semibold text-white transition-colors group-hover:text-teal-400" title={anime.title_english || anime.title}>
          {anime.title_english || anime.title}
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          {anime.year ? `${anime.year} • ` : ''}
          {anime.episodes ? `${anime.episodes} EPS` : 'Ongoing'}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {anime.genres?.slice(0, 2).map((genre) => (
          <span
            key={genre.mal_id}
            className="rounded-md border border-slate-700/50 bg-slate-800 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-300"
          >
            {genre.name}
          </span>
        ))}
        {anime.genres && anime.genres.length > 2 ? (
          <span className="rounded-md border border-slate-700/50 bg-slate-800 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            +{anime.genres.length - 2}
          </span>
        ) : null}
      </div>
    </div>
  </div>
);

const AnimeDetails = ({ anime, onBack, recommendations, relations, onRecommendationSelect }: AnimeDetailsProps) => {
  if (!anime) {
    return null;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-12 pt-24 md:px-8">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-slate-400 transition-colors hover:text-white group"
      >
        <div className="rounded-full bg-slate-800 p-2 transition-colors group-hover:bg-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="font-medium">Back to Discover</span>
      </button>

      <div className="flex flex-col gap-8 md:flex-row lg:gap-12">
        <div className="w-full shrink-0 md:w-1/3 lg:w-1/4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800 shadow-2xl">
            <img src={getImageUrl(anime)} alt={anime.title} className="h-auto w-full object-cover" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 text-center">
              <TrendingUp className="mx-auto mb-2 h-5 w-5 text-orange-400" />
              <div className="text-xs uppercase tracking-wider text-slate-400">Rank</div>
              <div className="text-xl font-bold text-white">#{anime.rank ?? 'N/A'}</div>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 text-center">
              <Star className="mx-auto mb-2 h-5 w-5 fill-current text-yellow-400" />
              <div className="text-xs uppercase tracking-wider text-slate-400">Score</div>
              <div className="text-xl font-bold text-white">{anime.score ?? 'TBA'}</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400">
              {anime.type || 'TV'}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
              <Calendar className="h-3.5 w-3.5" />
              {anime.status}
            </span>
            {anime.rating ? (
              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                {anime.rating.split(' ')[0]}
              </span>
            ) : null}
          </div>

          <h1 className="mb-2 text-3xl font-bold text-white md:text-5xl">{anime.title_english || anime.title}</h1>
          {anime.title_english && anime.title !== anime.title_english ? (
            <h2 className="mb-6 text-xl font-medium text-slate-400">{anime.title}</h2>
          ) : null}

          <div className="mb-8 flex flex-wrap gap-2">
            {anime.genres?.map((genre) => (
              <span
                key={genre.mal_id}
                className="cursor-default rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:border-slate-500"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <div className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Info className="h-5 w-5 text-teal-400" />
              Synopsis
            </h3>
            <p className="whitespace-pre-wrap rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 leading-relaxed text-slate-300">
              {formatSynopsis(anime.synopsis) ?? 'No synopsis available for this title.'}
            </p>
          </div>

          {anime.trailer?.embed_url ? (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Play className="h-5 w-5 text-orange-400" />
                Trailer
              </h3>
              <div className="aspect-video overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-xl">
                <iframe
                  src={anime.trailer.embed_url}
                  title={`${anime.title} Trailer`}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          {relations.length > 0 ? (
            <div className="mb-8">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Info className="h-5 w-5 text-teal-400" />
                Related Media
              </h3>
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6">
                {relations.map((rel, index) => (
                  <div key={`rel-${index}`} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                    <span className="shrink-0 text-sm font-bold uppercase tracking-wider text-teal-400 sm:w-32">
                      {rel.relation}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-300">
                      {rel.entry.map((e) => e.name).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              Recommendations Based on This Anime
            </h3>

            {recommendations.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recommendations.slice(0, 6).map((item) => (
                  <button
                    key={item.entry.mal_id}
                    type="button"
                    onClick={() => onRecommendationSelect(item.entry)}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition-all hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10"
                  >
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {getImageUrl(item.entry) ? (
                        <img src={getImageUrl(item.entry)} alt={item.entry.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 font-semibold text-white transition-colors group-hover:text-teal-400">
                        {item.entry.title_english || item.entry.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">{item.votes} votes</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 text-slate-300">
                No recommendations available for this anime right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [topAnime, setTopAnime] = useState<AnimeItem[]>([]);
  const [seasonAnime, setSeasonAnime] = useState<AnimeItem[]>([]);
  const [searchResults, setSearchResults] = useState<AnimeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationEntry[]>([]);
  const [relations, setRelations] = useState<AnimeRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      let topSuccess = false;
      let seasonSuccess = false;

      try {
        const topRes = await fetchTopAnime();
        setTopAnime(topRes.data || []);
        topSuccess = true;
      } catch (e) {
        console.warn('Failed to load top anime:', e);
        setTopAnime([]);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const fetchSeasonWithRetry = async (retryCount = 0) => {
        try {
          const seasonRes = await fetchSeasonAnime();
          setSeasonAnime(seasonRes.data || []);
          seasonSuccess = true;
        } catch (e) {
          if (retryCount < 1) {
            console.warn('Seasonal anime rate limited, retrying in 1 second...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await fetchSeasonWithRetry(retryCount + 1);
          } else {
            console.warn('Failed to load seasonal anime after retry:', e);
            setSeasonAnime([]);
          }
        }
      };

      await fetchSeasonWithRetry();

      if (!topSuccess && !seasonSuccess) {
        setError('Failed to load anime data. Please try again later.');
      }

      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  const handleSearch = async (query: string) => {
    try {
      setIsLoading(true);
      setSearchQuery(query);
      setView('search');
      const response = await searchAnime(query);
      setSearchResults(response.data || []);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnime = (anime: AnimeItem) => {
    void openAnimePage(anime);
  };

  const openAnimePage = async (anime: AnimeItem) => {
    try {
      setIsLoading(true);
      setError(null);

      const detailsResponse = await fetchAnimeDetails(anime.mal_id);
      setSelectedAnime(normalizeAnime(detailsResponse.data));

      await new Promise((resolve) => setTimeout(resolve, 400));
      
      try {
        const relationsResponse = await fetchAnimeRelations(anime.mal_id);
        setRelations(relationsResponse.data || []);
      } catch (relError) {
        console.warn('Failed to load relations:', relError);
        setRelations([]);
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      try {
        const recommendationsResponse = await fetchAnimeRecommendations(anime.mal_id);
        setRecommendations(recommendationsResponse.data || []);
      } catch (recError) {
        console.warn('Failed to load recommendations, failing gracefully:', recError);
        setRecommendations([]);
      }

      setView('details');
      window.scrollTo(0, 0);
    } catch {
      setError('Failed to open that anime. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => {
    setView('home');
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-teal-500/30 selection:text-teal-200">
      <Navbar onSearch={handleSearch} onHomeClick={goHome} />

      <main>
        {isLoading && view !== 'details' ? (
          <div className="pt-32">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="mx-auto mt-20 max-w-md rounded-2xl border border-red-900/50 bg-red-950/20 p-8 pt-32 text-center text-red-400">
            <p>{error}</p>
            <button
              onClick={goHome}
              className="mt-4 rounded-full bg-red-900/50 px-6 py-2 text-red-200 transition-colors hover:bg-red-800/50"
            >
              Return Home
            </button>
          </div>
        ) : (
          <>
            {view === 'home' ? (
              <div className="animate-in fade-in duration-500">
                {seasonAnime[0] || topAnime[0] ? (
                  <Hero anime={seasonAnime[0] || topAnime[0]} onSelect={handleSelectAnime} />
                ) : (
                  <div className="mx-auto flex min-h-[420px] max-w-7xl items-end px-4 pb-16 md:px-8">
                    <div className="max-w-3xl">
                      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 pr-4 pl-1.5 py-1.5 text-sm font-bold uppercase tracking-wider text-teal-400 shadow-lg shadow-teal-500/10">
                        <img 
                          src={navLogo}
                          alt="Logo" 
                          className="h-6 w-6 rounded-full object-cover" 
                        />
                        Anime Discovery Tool
                      </div>
                      <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-6xl">
                        Discover anime from a real seed title.
                      </h1>
                      <p className="text-lg leading-relaxed text-slate-300">
                        Search for a base anime, then open recommendations and related titles from Jikan.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <TrendingUp className="h-7 w-7 text-orange-500" />
                      Trending This Season
                    </h2>
                  </div>

                  {seasonAnime.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
                      {seasonAnime.slice(0, 10).map((anime, index) => (
                        <AnimeCard key={`season-${anime.mal_id}-${index}`} anime={anime} onSelect={handleSelectAnime} />
                      ))}
                    </div>
                  ) : (
                    <EmptySection
                      title="Seasonal anime is temporarily unavailable"
                      description="API is being rate-limited. Please try again later or search for anime directly."
                    />
                  )}

                  <div className="mb-8 mt-14 flex items-center justify-between">
                    <h2 className="flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
                      <Star className="h-7 w-7 text-yellow-400" />
                      Top Rated Anime of All Time
                    </h2>
                  </div>

                  {topAnime.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
                      {topAnime.slice(0, 10).map((anime, index) => (
                        <AnimeCard key={`top-${anime.mal_id}-${index}`} anime={anime} onSelect={handleSelectAnime} />
                      ))}
                    </div>
                  ) : (
                    <EmptySection
                      title="Top rated anime is temporarily unavailable"
                      description="If Jikan is being throttled, the rest of the app still stays usable and you can keep searching anime directly."
                    />
                  )}
                </div>
              </div>
            ) : null}

            {view === 'search' ? (
              <div className="mx-auto max-w-7xl animate-in fade-in px-4 pb-12 pt-32 duration-500 md:px-8">
                <div className="mb-10">
                  <h1 className="mb-2 text-3xl font-bold text-white">Search Results</h1>
                  <p className="text-lg text-slate-400">
                    Found {searchResults.length} results for{' '}
                    <span className="font-semibold text-orange-400">&quot;{searchQuery}&quot;</span>
                  </p>
                </div>

                {searchResults.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/50 py-20 text-center">
                    <Search className="mx-auto mb-4 h-16 w-16 text-slate-600" />
                    <h3 className="text-xl font-medium text-slate-300">No anime found matching your search.</h3>
                    <p className="mt-2 text-slate-500">Try adjusting your keywords or searching for something else.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-5 sm:grid-cols-3">
                    {searchResults.map((anime, index) => (
                      <AnimeCard key={`search-${anime.mal_id}-${index}`} anime={anime} onSelect={handleSelectAnime} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {view === 'details' && selectedAnime ? (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                <AnimeDetails
                  anime={selectedAnime}
                  onBack={() => {
                    setView(searchQuery ? 'search' : 'home');
                  }}
                  recommendations={recommendations}
                  relations={relations}
                  onRecommendationSelect={openAnimePage}
                />
              </div>
            ) : null}
          </>
        )}
      </main>

      {!isLoading ? (
        <footer className="mt-auto border-t border-slate-800/50 bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-slate-500 md:px-8">
            <p>Powered by the Jikan API. Data provided by MyAnimeList.</p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
