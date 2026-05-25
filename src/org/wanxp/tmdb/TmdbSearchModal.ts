import {App, SuggestModal, Notice} from "obsidian";
import DoubanPlugin from "../main";
import {i18nHelper} from "../lang/helper";
import {tmdbSearch, tmdbGetDetail, TmdbSearchResult} from "./TmdbApiService";
import DoubanMovieSubject from "../douban/data/model/DoubanMovieSubject";
import HandleContext from "../douban/data/model/HandleContext";
import {Action, SearchHandleMode} from "../constant/Constsant";

interface TmdbPickItem {
	id: number;
	title: string;
	year: string;
	score: number;
	overview: string;
}

export class TmdbPickModal extends SuggestModal<TmdbPickItem> {
	private plugin: DoubanPlugin;
	private allResults: TmdbPickItem[] = [];

	constructor(app: App, plugin: DoubanPlugin) {
		super(app);
		this.plugin = plugin;
		this.setPlaceholder(i18nHelper.getMessage("tmdb_search_placeholder"));
		this.limit = 20;
	}

	getSuggestions(query: string): TmdbPickItem[] {
		if (query.length < 2) {
			return [{id: -1, title: i18nHelper.getMessage("tmdb_type_more"), year: "", score: 0, overview: ""}];
		}
		if (this.allResults.length === 0) {
			this.doSearch(query);
			return [{id: -1, title: i18nHelper.getMessage("tmdb_searching"), year: "", score: 0, overview: ""}];
		}
		return this.allResults.filter(i =>
			i.title.toLowerCase().includes(query.toLowerCase())
		);
	}

	renderSuggestion(item: TmdbPickItem, el: HTMLElement): void {
		if (item.id === -1) {
			el.createEl("div", {text: item.title});
			return;
		}
		const title = el.createEl("div");
		title.createEl("span", {text: `${item.title} (${item.year})`});
		title.createEl("span", {text: `  ${item.score.toFixed(1)}`});
		if (item.overview) {
			el.createEl("div", {text: item.overview.substring(0, 100)});
		}
	}

	async onChooseSuggestion(item: TmdbPickItem, evt: MouseEvent | KeyboardEvent): Promise<void> {
		if (item.id === -1) return;

		const apiKey = this.plugin.settings.tmdbApiKey;
		if (!apiKey) {
			new Notice(i18nHelper.getMessage("tmdb_no_api_key"));
			return;
		}
		try {
			new Notice(`Fetching ${item.title}...`);
			const detail = await tmdbGetDetail(apiKey, item.id, this.plugin.settings.tmdbLanguage);

			const subject = new DoubanMovieSubject();
			subject.id = String(detail.id);
			subject.title = detail.title;
			subject.type = "movie";
			subject.score = detail.voteAverage;
			subject.originalTitle = detail.originalTitle;
			subject.desc = detail.overview;
			subject.url = `https://www.themoviedb.org/movie/${detail.id}`;
			subject.director = detail.directors.map((n: string) => ({name: n, "@type": "Person"} as any));
			subject.actor = detail.cast.map((n: string) => ({name: n, "@type": "Person"} as any));
			subject.aggregateRating = {"@type": "AggregateRating", ratingValue: detail.voteAverage, bestRating: 10} as any;
			subject.datePublished = detail.releaseDate ? new Date(detail.releaseDate) : undefined;
			subject.image = detail.posterPath;
			subject.imageUrl = detail.posterPath;
			subject.genre = detail.genres;
			subject.publisher = "";
			subject.aliases = [detail.originalTitle];
			subject.language = detail.spokenLanguages;
			subject.country = detail.productionCountries;
			subject.time = detail.runtime ? `${detail.runtime}分钟` : "";
			subject.IMDb = detail.imdbId || "";
			subject.tmdbId = String(detail.id);
			subject.priority = 0;

			const context: HandleContext = {
				plugin: this.plugin,
				mode: SearchHandleMode.FOR_CREATE,
				settings: this.plugin.settings,
				userComponent: this.plugin.userComponent,
				netFileHandler: this.plugin.netFileHandler,
				showAfterCreate: true,
				action: Action.SearchAndCrate,
			};
			const result = await this.plugin.doubanExtractHandler.parseText(subject, context);
			if (result) {
				await this.plugin.putContentToObsidian(context, result);
			}
			this.close();
		} catch (e) {
			new Notice(`Failed: ${e.message}`);
		}
	}

	private async doSearch(query: string): Promise<void> {
		const apiKey = this.plugin.settings.tmdbApiKey;
		if (!apiKey || query.length < 2) return;
		try {
			const results = await tmdbSearch(apiKey, query, this.plugin.settings.tmdbLanguage);
			this.allResults = results.map(r => ({
				id: r.id,
				title: r.title,
				year: r.year,
				score: r.voteAverage,
				overview: r.overview,
			}));
			this.open();
		} catch (e) {
			new Notice(`TMDB search failed: ${e.message}`);
		}
	}

	onOpen(): void {
		super.onOpen();
		this.allResults = [];
	}
}
