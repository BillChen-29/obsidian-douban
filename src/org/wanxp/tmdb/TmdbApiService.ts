import {requestUrl} from "obsidian";

export interface TmdbSearchResult {
	id: number;
	title: string;
	originalTitle: string;
	year: string;
	posterPath: string;
	voteAverage: number;
	overview: string;
}

export interface TmdbMovieDetail {
	id: number;
	title: string;
	originalTitle: string;
	overview: string;
	posterPath: string;
	backdropPath: string;
	releaseDate: string;
	voteAverage: number;
	runtime: number | null;
	genres: string[];
	directors: string[];
	cast: string[];
	productionCountries: string[];
	spokenLanguages: string[];
	imdbId: string | null;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export function tmdbSearch(apiKey: string, accessToken: string, query: string, language: string): Promise<TmdbSearchResult[]> {
	const headers: Record<string,string> = {};
  if (accessToken) { headers["Authorization"] = "Bearer " + accessToken; }
  const queryStr = accessToken ? "" : "api_key=" + apiKey + "&";
  const url = "https://api.themoviedb.org/3/search/movie?" + queryStr + "query=" + encodeURIComponent(query) + "&language=" + language + "&page=1&include_adult=true";
	return requestUrl({url, method: "GET", headers}).then(resp => {
		const json = resp.json;
		return (json.results || []).map((r: any) => ({
			id: r.id,
			title: r.title,
			originalTitle: r.original_title,
			year: r.release_date ? r.release_date.substring(0, 4) : "",
			posterPath: r.poster_path ? TMDB_IMAGE_BASE + r.poster_path : "",
			voteAverage: r.vote_average || 0,
			overview: r.overview || "",
		}));
	});
}

export function tmdbGetDetail(apiKey: string, accessToken: string, id: number, language: string): Promise<TmdbMovieDetail> {
	const headers: Record<string,string> = {};
	if (accessToken) {
		headers["Authorization"] = "Bearer " + accessToken;
	}
	const queryStr = accessToken ? "" : "api_key=" + apiKey + "&";
	const url = "https://api.themoviedb.org/3/movie/" + id + "?" + queryStr + "language=" + language + "&append_to_response=credits";
	return requestUrl({url, method: "GET", headers}).then(resp => {
		const r = resp.json;
		const crew = r.credits?.crew || [];
		const cast = r.credits?.cast || [];
		return {
			id: r.id,
			title: r.title,
			originalTitle: r.original_title,
			overview: r.overview || "",
			posterPath: r.poster_path ? TMDB_IMAGE_BASE + r.poster_path : "",
			backdropPath: r.backdrop_path ? TMDB_IMAGE_BASE + r.backdrop_path : "",
			releaseDate: r.release_date || "",
			voteAverage: r.vote_average || 0,
			runtime: r.runtime || null,
			genres: (r.genres || []).map((g: any) => g.name),
			directors: crew.filter((c: any) => c.job === "Director").map((c: any) => c.name),
			cast: cast.slice(0, 5).map((c: any) => c.name),
			productionCountries: (r.production_countries || []).map((c: any) => c.name),
			spokenLanguages: (r.spoken_languages || []).map((l: any) => l.english_name),
			imdbId: r.imdb_id || null,
		};
	});
}
