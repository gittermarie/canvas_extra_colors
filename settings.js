import { App, PluginSettingTab, Setting } from "obsidian";
import type CanvasColorPlugin from "./main";

export class CanvasColorSettingTab extends PluginSettingTab {
	plugin: CanvasColorPlugin;

	constructor(app: App, plugin: CanvasColorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Canvas Colors"
		});

		containerEl.createEl("p", {
			text: "Configure the colors that appear in the canvas color picker."
		});

		const colorsContainer = containerEl.createDiv();

		const renderColors = () => {
			colorsContainer.empty();

			this.plugin.settings.defaultColors.forEach((color, index) => {

				new Setting(colorsContainer)
					.setName(`Color ${index + 1}`)
					.addColorPicker(colorPicker => {
						colorPicker
							.setValue(color)
							.onChange(async (value) => {
								this.plugin.settings.defaultColors[index] = value;
								await this.plugin.saveSettings();
							});
					})
					.addButton(button => {
						button
							.setButtonText("Remove")
							.onClick(async () => {
								this.plugin.settings.defaultColors.splice(index, 1);
								await this.plugin.saveSettings();
								renderColors();
							});
					});
			});
		};

		renderColors();

		new Setting(containerEl)
			.setName("Add color")
			.setDesc("Add another custom canvas color")
			.addButton(button => {
				button
					.setButtonText("+ Add")
					.onClick(async () => {
						this.plugin.settings.defaultColors.push("#FFFFFF");
						await this.plugin.saveSettings();
						renderColors();
					});
			});
	}
}
