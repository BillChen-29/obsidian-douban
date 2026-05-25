export const WATCHLIST_MOC_CONTENT = `---
cssclasses: []
---

# 电影看单

> 使用 Dataview 自动从 movie/ 目录读取电影笔记，按状态分组。

## 想看

\`\`\`dataview
TABLE WITHOUT ID
  ("![](" + image + ")") as 海报,
  title as 片名,
  score as 评分,
  director as 导演,
  datePublished as 上映日期
FROM "movie"
WHERE type = "movie" AND status = "想看"
SORT datePublished DESC
\`\`\`

## 看过

\`\`\`dataview
TABLE WITHOUT ID
  ("![](" + image + ")") as 海报,
  title as 片名,
  score as 评分,
  director as 导演,
  datePublished as 上映日期
FROM "movie"
WHERE type = "movie" AND status = "看过"
SORT datePublished DESC
\`\`\`

## 在看

\`\`\`dataview
TABLE WITHOUT ID
  ("![](" + image + ")") as 海报,
  title as 片名,
  score as 评分,
  director as 导演,
  datePublished as 上映日期
FROM "movie"
WHERE type = "movie" AND status = "在看"
SORT datePublished DESC
\`\`\`

---

*状态切换：打开电影笔记 → Cmd+P → 切换电影状态*
*依赖插件：[Dataview](https://github.com/blacksmithgu/obsidian-dataview)*
`;

/**
 * 获取 watchlist 文件的 vault 路径。
 * 固定放在 movie/电影看单.md。
 */
export function getWatchlistPath(): string {
	return "movie/电影看单.md";
}

/**
 * 状态循环切换映射
 */
export const STATUS_CYCLE: Record<string, string> = {
	"": "想看",
	"想看": "看过",
	"看过": "想看",
};
