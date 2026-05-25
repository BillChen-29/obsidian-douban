import {Setting} from "obsidian";
import {i18nHelper} from "../../lang/helper";
import SettingsManager from "./SettingsManager";

export function constructTmdbUI(containerEl: HTMLElement, manager: SettingsManager): void {
	containerEl.createEl("h3", {text: i18nHelper.getMessage("tmdb_settings_title")});

	new Setting(containerEl)
		.setName(i18nHelper.getMessage("tmdb_api_key"))
		.setDesc(i18nHelper.getMessage("tmdb_api_key_desc"))
		.addText(text => text
			.setPlaceholder(i18nHelper.getMessage("tmdb_api_key_placeholder"))
			.setValue(manager.plugin.settings.tmdbApiKey)
			.onChange(async (value) => {
				manager.plugin.settings.tmdbApiKey = value;
				await manager.plugin.saveSettings();
			}));

	new Setting(containerEl)
		.setName(i18nHelper.getMessage("tmdb_language"))
		.setDesc(i18nHelper.getMessage("tmdb_language_desc"))
		.addText(text => text
			.setPlaceholder("zh-CN")
			.setValue(manager.plugin.settings.tmdbLanguage)
			.onChange(async (value) => {
				manager.plugin.settings.tmdbLanguage = value || "zh-CN";
				await manager.plugin.saveSettings();
			}));

	new Setting(containerEl)
		.setName(i18nHelper.getMessage("tmdb_enabled"))
		.setDesc(i18nHelper.getMessage("tmdb_enabled_desc"))
		.addToggle(toggle => toggle
			.setValue(manager.plugin.settings.tmdbEnabled)
			.onChange(async (value) => {
				manager.plugin.settings.tmdbEnabled = value;
				await manager.plugin.saveSettings();
			}));
}
