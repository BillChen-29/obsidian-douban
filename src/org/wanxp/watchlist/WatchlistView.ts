import {ItemView, WorkspaceLeaf, TFile} from "obsidian";
import DoubanPlugin from "../main";

export const VIEW_TYPE_WATCHLIST = "movie-watchlist";

export class WatchlistView extends ItemView {
  private plugin: DoubanPlugin;
  private currentTab: "想看" | "看过" = "看过";

  constructor(leaf: WorkspaceLeaf, plugin: DoubanPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_WATCHLIST;
  }

  getDisplayText(): string {
    return "电影看单";
  }

  getIcon(): string {
    return "film";
  }

  async onOpen(): Promise<void> {
    this.containerEl = this.contentEl;
    this.render();
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  private render(): void {
    this.containerEl.empty();
    this.containerEl.style.padding = "12px";
    this.containerEl.style.overflowY = "auto";

    // Header
    const header = this.containerEl.createEl("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.marginBottom = "16px";
    header.style.gap = "8px";

    const title = header.createEl("h2", { text: "🎬 电影看单" });
    title.style.margin = "0";
    title.style.flex = "1";

    // Refresh button
    const refreshBtn = header.createEl("button", { text: "🔄" });
    refreshBtn.style.cssText = "background:none;border:1px solid var(--interactive-accent);border-radius:4px;padding:4px 8px;cursor:pointer;font-size:14px";
    refreshBtn.onclick = () => this.render();

    // Tabs
    const tabs = this.containerEl.createEl("div");
    tabs.style.display = "flex";
    tabs.style.gap = "4px";
    tabs.style.marginBottom = "16px";

    const statuses: ("想看" | "看过")[] = ["看过", "想看"];
    for (const s of statuses) {
      const tab = tabs.createEl("button", { text: s });
      tab.style.cssText = `padding:6px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;${
        s === this.currentTab
          ? "background:var(--interactive-accent);color:var(--text-on-accent);"
          : "background:var(--background-secondary);color:var(--text-muted);"
      }`;
      tab.onclick = () => {
        this.currentTab = s;
        this.render();
      };
    }

    // Find movies
    const files = this.plugin.app.vault.getMarkdownFiles().filter(
      (f) => f.path.startsWith("movie/notes/")
    );

    const movies: Array<{ file: TFile; title: string; score: string | number; poster: string; mvStatus: string }> = [];

    for (const file of files) {
      const cache = this.plugin.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      if (!fm || fm.type !== "movie") continue;
      if (fm.mvStatus !== this.currentTab) continue;

      movies.push({
        file,
        title: fm.title || file.basename,
        score: fm.score || "",
        poster: fm.poster || "",
        mvStatus: fm.mvStatus || "",
      });
    }

    if (movies.length === 0) {
      const empty = this.containerEl.createEl("div", {
        text: this.currentTab === "想看" ? "暂无想看的电影" : "还没有看过的电影",
      });
      empty.style.cssText = "color:var(--text-muted);padding:24px;text-align:center";
      return;
    }

    // Card grid
    const grid = this.containerEl.createEl("div");
    grid.style.display = "flex";
    grid.style.flexWrap = "wrap";
    grid.style.gap = "12px";

    for (const m of movies) {
      const card = grid.createEl("div");
      card.style.cssText =
        "width:160px;border-radius:8px;overflow:hidden;background:var(--background-primary-alt);box-shadow:0 1px 3px rgba(0,0,0,0.12);cursor:pointer;transition:transform 0.15s";
      card.onmouseenter = () => (card.style.transform = "translateY(-2px)");
      card.onmouseleave = () => (card.style.transform = "");

      // Poster
      if (m.poster) {
        const imgFile = this.plugin.app.vault.getAbstractFileByPath(m.poster) as TFile;
        if (imgFile) {
          const img = card.createEl("img");
          img.src = this.plugin.app.vault.getResourcePath(imgFile);
          img.style.cssText = "width:100%;height:220px;object-fit:cover;display:block";
        }
      }

      // Info
      const info = card.createEl("div");
      info.style.cssText = "padding:8px 10px 10px";

      const ti = info.createEl("div", { text: m.title });
      ti.style.cssText =
        "font-weight:600;font-size:13px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";

      if (m.score) {
        const sc = info.createEl("div", { text: "⭐ " + m.score });
        sc.style.cssText = "font-size:12px;color:var(--text-muted);margin-bottom:8px";
      }

      // Toggle button
      const nextStatus = m.mvStatus === "想看" ? "看过" : "想看";
      const btn = info.createEl("button", {
        text: m.mvStatus === "想看" ? "✓ 看过" : "↩ 想看",
      });
      btn.style.cssText = `width:100%;padding:4px 0;font-size:12px;border:1px solid var(--interactive-accent);border-radius:4px;cursor:pointer;${
        m.mvStatus === "想看"
          ? "background:var(--interactive-accent);color:var(--text-on-accent);"
          : "background:transparent;color:var(--interactive-accent);"
      }`;
      btn.onclick = async (e) => {
        e.stopPropagation();
        btn.textContent = "...";
        btn.disabled = true;
        try {
          await this.plugin.app.fileManager.processFrontMatter(m.file, (fm: any) => {
            fm.mvStatus = nextStatus;
          });
          this.render();
        } catch {
          btn.textContent = "失败";
          btn.disabled = false;
        }
      };

      // Click card → open note
      card.onclick = () => {
        this.plugin.app.workspace.getLeaf(false).openFile(m.file);
      };
    }
  }
}
