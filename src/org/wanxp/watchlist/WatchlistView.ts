import {ItemView, WorkspaceLeaf, TFile} from "obsidian";
import DoubanPlugin from "../main";

export const VIEW_TYPE_WATCHLIST = "movie-watchlist";

interface MovieCard {
  file: TFile;
  title: string;
  score: string | number;
  poster: string;
  mvStatus: string;
  director: string;
  genre: string;
}

export class WatchlistView extends ItemView {
  private plugin: DoubanPlugin;
  private currentTab: "想看" | "看过" = "看过";
  private allMovies: MovieCard[] = [];

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
    this.render();
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("div", { text: "加载中..." });
    this.renderAsync();
  }

  private async renderAsync(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.style.padding = "12px";
    this.contentEl.style.overflowY = "auto";

    // Header
    const header = this.contentEl.createEl("div");
    header.style.cssText = "display:flex;align-items:center;margin-bottom:12px;gap:8px";

    const title = header.createEl("h2", { text: "🎬 电影看单" });
    title.style.cssText = "margin:0;flex:1";

    const refreshBtn = header.createEl("button", { text: "🔄" });
    refreshBtn.style.cssText = "background:none;border:1px solid var(--interactive-accent);border-radius:4px;padding:4px 8px;cursor:pointer;font-size:14px";
    refreshBtn.onclick = () => this.render();

    // Tabs
    const tabs = this.contentEl.createEl("div");
    tabs.style.cssText = "display:flex;gap:4px;margin-bottom:12px";

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

    // Search
    const searchInput = this.contentEl.createEl("input", {
      type: "text",
      placeholder: "搜索...",
    });
    searchInput.style.cssText = "width:100%;padding:6px 10px;margin-bottom:12px;border:1px solid var(--background-modifier-border);border-radius:4px;background:var(--background-primary);color:var(--text-normal);font-size:13px;box-sizing:border-box";

    // Grid container
    const gridContainer = this.contentEl.createEl("div");
    gridContainer.id = "watchlist-grid";

    // Load movies
    const files = this.plugin.app.vault.getMarkdownFiles().filter(
      (f) => f.path.startsWith("movie/notes/")
    );

    this.allMovies = [];
    for (const file of files) {
      const content = await this.plugin.app.vault.read(file);
      const fm = this.parseFrontmatter(content);
      if (!fm || fm.type !== "movie") continue;
      if (fm.mvStatus !== this.currentTab) continue;

      this.allMovies.push({
        file,
        title: fm.title || file.basename,
        score: fm.score || "",
        poster: fm.poster || "",
        mvStatus: fm.mvStatus || "",
        director: (fm.director || []).join(", "),
        genre: (fm.genre || []).join(", "),
      });
    }

    // Filter handler
    const doFilter = () => {
      const q = searchInput.value.toLowerCase();
      const filtered = q
        ? this.allMovies.filter(m => {
            const haystack = [m.title, m.director, m.genre, m.score?.toString() || ""].join(" ").toLowerCase();
            return haystack.includes(q);
          })
        : this.allMovies;
      this.renderGrid(gridContainer, filtered);
    };
    searchInput.oninput = doFilter;

    // Initial render
    doFilter();
  }

  private renderGrid(container: HTMLElement, movies: MovieCard[]): void {
    container.empty();

    if (movies.length === 0) {
      const empty = container.createEl("div", {
        text: this.currentTab === "想看" ? "暂无想看的电影" : "还没有看过的电影",
      });
      empty.style.cssText = "color:var(--text-muted);padding:24px;text-align:center";
      return;
    }

    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "12px";

    for (const m of movies) {
      const card = container.createEl("div");
      card.style.cssText =
        "width:160px;border-radius:8px;overflow:hidden;background:var(--background-primary-alt);box-shadow:0 1px 3px rgba(0,0,0,0.12);cursor:pointer;transition:transform 0.15s";
      card.onmouseenter = () => (card.style.transform = "translateY(-2px)");
      card.onmouseleave = () => (card.style.transform = "");

      if (m.poster) {
        const imgFile = this.plugin.app.vault.getAbstractFileByPath(m.poster) as TFile;
        if (imgFile) {
          const img = card.createEl("img");
          img.src = this.plugin.app.vault.getResourcePath(imgFile);
          img.style.cssText = "width:100%;height:220px;object-fit:cover;display:block";
        }
      }

      const info = card.createEl("div");
      info.style.cssText = "padding:8px 10px 10px";

      const ti = info.createEl("div", { text: m.title });
      ti.style.cssText = "font-weight:600;font-size:13px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";

      if (m.score) {
        const sc = info.createEl("div", { text: "⭐ " + m.score });
        sc.style.cssText = "font-size:12px;color:var(--text-muted);margin-bottom:8px";
      }

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

      card.onclick = () => {
        this.plugin.app.workspace.getLeaf(false).openFile(m.file);
      };
    }
  }

  private parseFrontmatter(content: string): Record<string, any> | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    const yaml = match[1];
    const result: Record<string, any> = {};
    for (const line of yaml.split("\n")) {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) {
        let val: any = m[2].trim();
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (val === "" || val === "null") val = null;
        else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
        result[m[1]] = val;
      }
    }
    return result;
  }
}
