const { Plugin, PluginSettingTab, Setting } = require("obsidian");

const DEFAULT_SETTINGS = {
	favorites: [
		{
        	    name: "red",
        	    color: "#ff0000"
    		},
    		{
    		    id: "green",
    		    color: "#00ff00"
    		},
    		{
    		    id: "blue",
    		    color: "#0000ff"
    		}
	],
    	history: ["#000000"],
    	historyLength: 10
};

module.exports = class CanvasExtraColors extends Plugin {

    async loadSettings() {
	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
	await this.saveData(this.settings);
    } 
	
    async onload() {
	await this.loadSettings();

	this.addSettingTab(new CanvasColorSettingTab(this.app, this));

        this.observer = new MutationObserver(() => {
            this.inject();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.register(() => this.observer.disconnect());
    }

    inject() {

	let updatingColor = false;

        const picker = document.querySelector(".canvas-submenu");
        if (!picker) return;

        if (picker.querySelector(".cec-builtins"))
            return;

        const custom = picker.querySelector("input[type=color]");
        if (!custom)
            return;

        custom.addEventListener("change", () => {
    	    if (updatingColor) return;

            const color = custom.value;

            this.settings.history = [
                color,
                ...this.settings.history.filter(c => c !== color)
            ].slice(0, this.settings.historyLength);

            this.saveSettings();
        });

	const favorites = document.createElement("div");
        favorites.className = "cec-favorites";

        for (const color of this.settings.favorites) {

            const swatch = document.createElement("div");

            swatch.className = "canvas-color-picker-item cec-item";
            swatch.style.background = color.color;
            swatch.title = color.name;

            swatch.onclick = (evt) => {

                evt.stopPropagation();

		updatingColor = true;

                custom.value = color.color;

                custom.dispatchEvent(
                    new Event("input", {
                        bubbles: true
                    })
                );

                custom.dispatchEvent(
                    new Event("change", {
                        bubbles: true
                    })
                );
		
		updatingColor = false;
            };

            favorites.appendChild(swatch);
        }

	const history = document.createElement("div");
        history.className = "cec-history";

        for (const color of this.settings.history) {

            const swatch = document.createElement("div");

            swatch.className = "canvas-color-picker-item cec-item";
            swatch.style.background = color;
            swatch.title = color;

            swatch.onclick = (evt) => {

                evt.stopPropagation();

                custom.value = color;

                custom.dispatchEvent(
                    new Event("input", {
                        bubbles: true
                    })
                );

                custom.dispatchEvent(
                    new Event("change", {
                        bubbles: true
                    })
                );

            };

            history.appendChild(swatch);
        }

	picker.prepend(history);
	const history_title = document.createElement("div");
	history_title.className = "cec-title";
	const history_text = document.createTextNode("History");
	history_title.appendChild(history_text);
	picker.prepend(history_title);
	
	const history_hr = document.createElement("hr");
	history_hr.className = "cec-divider";
	picker.prepend(history_hr);


        picker.prepend(favorites);
	const title = document.createElement("div");
	title.className = "cec-title";
	const text = document.createTextNode("Favorites");
	title.appendChild(text);
	picker.prepend(title);
	
	const hr = document.createElement("hr");
	hr.className = "cec-divider";
	picker.prepend(hr);


        const builtins = document.createElement("div");
	builtins.className = "cec-builtins";

	const originals = [
    	    ...picker.querySelectorAll(
        	":scope > .canvas-color-picker-item"
    	    )
	];

	for (const item of originals) {
    		builtins.appendChild(item);
	}

	picker.prepend(builtins);

    }

    onunload() {}
}

class CanvasColorSettingTab extends PluginSettingTab {

    constructor(app, plugin) {
	super(app, plugin);
	this.plugin = plugin;
    }

    display() {
	    const { containerEl } = this;
	
	    containerEl.empty();
	
	    containerEl.createEl("h2", {
	        text: "Canvas Extra Colors"
	    });
	
	    const redraw = () => this.display();
	
	    //
	    // Favorite colors
	    //
	
	    containerEl.createEl("h3", {
	        text: "Favorite colors"
	    });
	
	    this.plugin.settings.favorites.forEach((favorite, index) => {
	
	        new Setting(containerEl)
	            .setName(`Color ${index + 1}`)
	            .addText(text => {
	
	                text.setPlaceholder("Name");
	                text.setValue(favorite.name);
	
	                text.onChange(async value => {
	
	                    this.plugin.settings.favorites[index].name = value;
	
	                    await this.plugin.saveSettings();
	
	                });
	
	            })
	            .addColorPicker(cp => {
	
	                cp.setValue(favorite.color);
	
	                cp.onChange(async value => {
	
	                    this.plugin.settings.favorites[index].color = value;
	
	                    await this.plugin.saveSettings();
	
	                });
	
	            })
	            .addExtraButton(btn => {
	
	                btn.setIcon("trash");
	                btn.setTooltip("Remove");
	
	                btn.onClick(async () => {
	
	                    this.plugin.settings.favorites.splice(index, 1);
	
	                    await this.plugin.saveSettings();
	
	                    redraw();
	
	                });
	
	            });
	
	    });
	
	
	    let newName = `color-${this.plugin.settings.favorites.length + 1}`;
	    let newColor = "#ffffff";
	
	    new Setting(containerEl)
	        .setName("Add favorite color")
	        .setDesc("Append another favorite color.")
	        .addText(text => {
	
	            text.setValue(newName);
	
	            text.onChange(value => {
	                newName = value;
	            });
	
	        })
	        .addColorPicker(cp => {
	
	            cp.setValue(newColor);
	
	            cp.onChange(value => {
	                newColor = value;
	            });
	
	        })
	        .addButton(btn => {
	
	            btn.setButtonText("Add");
	
	            btn.onClick(async () => {
	
	                this.plugin.settings.favorites.push({
	                    name: newName,
	                    color: newColor
	                });
	
	                await this.plugin.saveSettings();
	
	                redraw();
	
	            });
	
	        });
	
	
	    //
	    // History
	    //
	
	    containerEl.createEl("h3", {
	        text: "Color history"
	    });
	
	    this.plugin.settings.history.forEach((color, index) => {
	
	        new Setting(containerEl)
	            .setName(`History color ${index + 1}`)
	            .addColorPicker(cp => {
	
	                cp.setValue(color);
	
	                cp.onChange(async value => {
	
	                    this.plugin.settings.history[index] = value;
	
	                    await this.plugin.saveSettings();
	
	                });
	
	            })
	            .addExtraButton(btn => {
	
	                btn.setIcon("star");
	                btn.setTooltip("Add to favorites");
	
	                btn.onClick(async () => {
	
	                    this.plugin.settings.favorites.push({
	                        name: `color-${this.plugin.settings.favorites.length + 1}`,
	                        color
	                    });
	
	                    await this.plugin.saveSettings();
	
	                    redraw();
	
	                });
	
	            });
	
	    });
	
	
	    new Setting(containerEl)
	        .setName("History length")
	        .setDesc("Maximum number of remembered colors.")
	        .addText(text => {
	
	            text.inputEl.type = "number";
	
	            text.setValue(String(this.plugin.settings.historyLength));
	
	            text.onChange(async value => {
	
	                const length = Math.max(0, Number(value) || 0);
	
	                this.plugin.settings.historyLength = length;
	
	                this.plugin.settings.history =
	                    this.plugin.settings.history.slice(0, length);
	
	                await this.plugin.saveSettings();
	
	            });
	
	        });
	
	
	    //
	    // Reset
	    //
	
	    containerEl.createEl("h3", {
	        text: "Reset"
	    });
	
	    new Setting(containerEl)
	        .setName("Reset favorites")
	        .setDesc("Restore the default palette.")
	        .addButton(btn => {
	
	            btn.setWarning();
	            btn.setButtonText("Reset");
	
	            btn.onClick(async () => {
	
	                this.plugin.settings.favorites =
	                    structuredClone(DEFAULT_SETTINGS.favorites);
	
	                await this.plugin.saveSettings();
	
	                redraw();
	
	            });
	
	        });
	
	
	    new Setting(containerEl)
	        .setName("Clear history")
	        .setDesc("Remove all recently used colors.")
	        .addButton(btn => {
	
	            btn.setWarning();
	            btn.setButtonText("Clear");
	
	            btn.onClick(async () => {
	
	                this.plugin.settings.history = [];
	
	                await this.plugin.saveSettings();
	
	                redraw();
	
	            });
	
	        });
	}
} 
