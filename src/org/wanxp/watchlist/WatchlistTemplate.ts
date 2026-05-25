export const WANT_TO_WATCH_CONTENT = `---
cssclasses: []
---

# 想看

\`\`\`dataviewjs
const status = "想看";
const toStatus = "看过";
const btnLabel = "✓ 看过";

const movies = dv.pages('"movie/notes"')
  .where(p => p.type === "movie" && p.status === status)
  .sort(p => p.datePublished, 'desc');

if (movies.length === 0) {
  dv.paragraph("暂无电影。导入电影后自动出现在这里。");
} else {
  const grid = dv.el("div", "");
  grid.style.display = "flex";
  grid.style.flexWrap = "wrap";
  grid.style.gap = "12px";
  grid.style.padding = "8px 0";
  dv.container.appendChild(grid);

  for (const page of movies) {
    const card = dv.el("div", "", { container: grid });
    card.style.width = "160px";
    card.style.borderRadius = "8px";
    card.style.overflow = "hidden";
    card.style.background = "var(--background-primary-alt)";
    card.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
    card.style.cursor = "pointer";
    card.style.transition = "transform 0.15s";

    card.onmouseenter = () => card.style.transform = "translateY(-2px)";
    card.onmouseleave = () => card.style.transform = "";

    // 海报
    if (page.image) {
      const img = dv.el("img", "", { container: card });
      img.src = page.image;
      img.style.width = "100%";
      img.style.height = "220px";
      img.style.objectFit = "cover";
      img.style.display = "block";
    }

    // 信息区
    const info = dv.el("div", "", { container: card });
    info.style.padding = "8px 10px 10px";

    const title = dv.el("div", page.title || "", { container: info });
    title.style.fontWeight = "600";
    title.style.fontSize = "13px";
    title.style.marginBottom = "4px";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";

    if (page.score) {
      const scoreEl = dv.el("div", "⭐ " + page.score, { container: info });
      scoreEl.style.fontSize = "12px";
      scoreEl.style.color = "var(--text-muted)";
      scoreEl.style.marginBottom = "8px";
    }

    // 按钮
    const btn = dv.el("button", btnLabel, { container: info });
    btn.style.width = "100%";
    btn.style.padding = "4px 0";
    btn.style.fontSize = "12px";
    btn.style.border = "1px solid var(--interactive-accent)";
    btn.style.borderRadius = "4px";
    btn.style.background = "var(--interactive-accent)";
    btn.style.color = "var(--text-on-accent)";
    btn.style.cursor = "pointer";

    btn.onclick = async (e) => {
      e.stopPropagation();
      btn.textContent = "...";
      btn.disabled = true;
      try {
        const file = app.vault.getAbstractFileByPath(page.file.path);
        await app.fileManager.processFrontMatter(file, fm => {
          fm.status = toStatus;
        });
        // Force Dataview refresh
        app.metadataCache.trigger("dataview:metadata-change");
        app.workspace.trigger("dataview:refresh-views");
      } catch(err) {
        btn.textContent = "失败";
        btn.disabled = false;
      }
    };

    // 点击卡片打开笔记
    card.onclick = () => {
      app.workspace.openLinkText(page.file.path, "", false);
    };
  }
}
\`\`\`
`;

export const WATCHED_CONTENT = `---
cssclasses: []
---

# 看过

\`\`\`dataviewjs
const status = "看过";
const toStatus = "想看";
const btnLabel = "↩ 想看";

const movies = dv.pages('"movie/notes"')
  .where(p => p.type === "movie" && p.status === status)
  .sort(p => p.datePublished, 'desc');

if (movies.length === 0) {
  dv.paragraph("还没有看过的电影。");
} else {
  const grid = dv.el("div", "");
  grid.style.display = "flex";
  grid.style.flexWrap = "wrap";
  grid.style.gap = "12px";
  grid.style.padding = "8px 0";
  dv.container.appendChild(grid);

  for (const page of movies) {
    const card = dv.el("div", "", { container: grid });
    card.style.width = "160px";
    card.style.borderRadius = "8px";
    card.style.overflow = "hidden";
    card.style.background = "var(--background-primary-alt)";
    card.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
    card.style.cursor = "pointer";
    card.style.transition = "transform 0.15s";

    card.onmouseenter = () => card.style.transform = "translateY(-2px)";
    card.onmouseleave = () => card.style.transform = "";

    if (page.image) {
      const img = dv.el("img", "", { container: card });
      img.src = page.image;
      img.style.width = "100%";
      img.style.height = "220px";
      img.style.objectFit = "cover";
      img.style.display = "block";
    }

    const info = dv.el("div", "", { container: card });
    info.style.padding = "8px 10px 10px";

    const title = dv.el("div", page.title || "", { container: info });
    title.style.fontWeight = "600";
    title.style.fontSize = "13px";
    title.style.marginBottom = "4px";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";

    if (page.score) {
      const scoreEl = dv.el("div", "⭐ " + page.score, { container: info });
      scoreEl.style.fontSize = "12px";
      scoreEl.style.color = "var(--text-muted)";
      scoreEl.style.marginBottom = "8px";
    }

    const btn = dv.el("button", btnLabel, { container: info });
    btn.style.width = "100%";
    btn.style.padding = "4px 0";
    btn.style.fontSize = "12px";
    btn.style.border = "1px solid var(--interactive-accent)";
    btn.style.borderRadius = "4px";
    btn.style.background = "transparent";
    btn.style.color = "var(--interactive-accent)";
    btn.style.cursor = "pointer";

    btn.onclick = async (e) => {
      e.stopPropagation();
      btn.textContent = "...";
      btn.disabled = true;
      try {
        const file = app.vault.getAbstractFileByPath(page.file.path);
        await app.fileManager.processFrontMatter(file, fm => {
          fm.status = toStatus;
        });
        // Force Dataview refresh
        app.metadataCache.trigger("dataview:metadata-change");
        app.workspace.trigger("dataview:refresh-views");
      } catch(err) {
        btn.textContent = "失败";
        btn.disabled = false;
      }
    };

    card.onclick = () => {
      app.workspace.openLinkText(page.file.path, "", false);
    };
  }
}
\`\`\`
`;

/**
 * 返回 { path: content } 映射
 */
export function getWatchlistFiles(): Record<string, string> {
  return {
    "movie/想看": WANT_TO_WATCH_CONTENT,
    "movie/看过": WATCHED_CONTENT,
  };
}
