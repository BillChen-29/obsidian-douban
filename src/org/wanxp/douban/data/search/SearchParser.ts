import {CheerioAPI, load} from "cheerio";
import DoubanSearchResultSubject from "../model/DoubanSearchResultSubject";
import {SearchPage} from "../model/SearchPage";
import {log} from "../../../utils/Logutil";
import {SupportType} from "../../../constant/Constsant";

export default class SearchParserHandler {
	static parseSearch(dataHtml: CheerioAPI): DoubanSearchResultSubject[] {
		return dataHtml('.result')
			.get()
			.map((i: any) => {
				const item = dataHtml(i);
				let idPattern = /(\d){5,10}/g;
				let urlPattern = /(https%3A%2F%2F)\S+(\d){5,10}(%2F)/g;
				let linkValue = item.find("div.content > div > h3 > a").attr("href");
				let ececResult = idPattern.exec(linkValue);
				let urlResult = urlPattern.exec(linkValue);
				let cast = item.find(".subject-cast").text();
				let score = item.find(".rating_nums").text();
				let title = item.find("div.content > div > h3 > a").text();
				let type = item.find("div.content > div > h3 > span").text();
				let desc = item.find("div.content > p").text();
				const result: DoubanSearchResultSubject = {
					id: ececResult ? ececResult[0] : '',
					title: title ? title : '-',
					score: score ? Number(score) : null,
					cast: cast,
					type: type ? type : '-',
					desc: desc ? desc : '-',
					url: urlResult ? decodeURIComponent(urlResult[0]) : 'https://www.douban.com',
					image: "",
					imageUrl: "",
					publisher: "",
					datePublished: undefined,
					genre: []
				};
				return result;
			})
	}

	static parseSearchJson(result: string, type:SupportType, pageNum:number): SearchPage {
		log.debug("解析给多页面结果");
		const data:{total:number, limit:number, more:boolean, items:string[]} = JSON.parse(result);
		const list:string[] = data.items;
		const resultList:DoubanSearchResultSubject[] = list
			.map(e => load(e))
			.map(e=>this.parseSearch(e))
			.map(e => e? e[0]:null)
			.filter(e => e && this.matchSearchType(e, type));
			return new SearchPage(data.total, pageNum, data.limit, type, resultList);
		};

	/**
	 * 按搜索类型二次过滤结果。Douban API 的 cat 参数过滤不完美，
	 * 通过结果中的 type 标签（[电影]/[书籍]等）做二次确认。
	 * SupportType.all 不过滤。
	 */
	private static matchSearchType(item: DoubanSearchResultSubject, searchType: SupportType): boolean {
		if (searchType === SupportType.all) return true;
		const typeStr = item.type || '';
		const mapping: Record<string, SupportType> = {
			'电影': SupportType.movie,
			'电视剧': SupportType.teleplay,
			'图书': SupportType.book,
			'书籍': SupportType.book,
			'音乐': SupportType.music,
			'游戏': SupportType.game,
			'舞台剧': SupportType.theater,
			'日记': SupportType.note,
		};
		for (const [label, st] of Object.entries(mapping)) {
			if (typeStr.includes(label)) return st === searchType;
		}
		return false;
	}

}
