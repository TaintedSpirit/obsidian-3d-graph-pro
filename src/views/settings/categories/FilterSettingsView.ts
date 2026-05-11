import { Setting } from "obsidian";
import { FilterSettings } from "src/settings/categories/FilterSettings";
import State from "src/util/State";

const FilterSettingsView = (
	filterSettings: State<FilterSettings>,
	containerEl: HTMLElement
) => {
	new Setting(containerEl).setName("Show Orphans").addToggle((toggle) => {
		toggle.setValue(filterSettings.value.doShowOrphans ?? true).onChange((value) => {
			filterSettings.value.doShowOrphans = value;
		});
	});

	new Setting(containerEl).setName("Show Attachments").addToggle((toggle) => {
		toggle.setValue(filterSettings.value.doShowAttachments ?? false).onChange((value) => {
			filterSettings.value.doShowAttachments = value;
		});
	});

	new Setting(containerEl)
		.setName("Path Filter")
		.setDesc("Show only nodes matching this text")
		.addText((text) => {
			text.setPlaceholder("e.g. Projects/ or .md")
				.setValue(filterSettings.value.pathFilter ?? "")
				.onChange((value) => {
					filterSettings.value.pathFilter = value;
				});
		});
};

export default FilterSettingsView;
