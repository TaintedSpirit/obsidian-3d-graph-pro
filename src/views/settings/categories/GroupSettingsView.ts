import { ButtonComponent, ExtraButtonComponent, TextComponent } from "obsidian";
import { GroupSettings, NodeGroup } from "src/settings/categories/GroupSettings";
import ObsidianTheme from "src/util/ObsidianTheme";
import State, { StateChange } from "src/util/State";
import ColorPicker from "src/views/atomics/ColorPicker";

// Palette for auto-folder coloring
const FOLDER_COLORS = [
	"#e06c75", "#98c379", "#e5c07b", "#61afef",
	"#c678dd", "#56b6c2", "#d19a66", "#abb2bf",
];

const GroupSettingsView = (
	groupSettings: State<GroupSettings>,
	containerEl: HTMLElement,
	theme: ObsidianTheme
) => {
	renderAll(groupSettings, containerEl, theme);

	groupSettings.onChange((change: StateChange) => {
		if (
			(change.currentPath === "groups" && change.type === "add") ||
			change.type === "delete"
		) {
			containerEl.empty();
			renderAll(groupSettings, containerEl, theme);
		}
	});
};

const renderAll = (
	groupSettings: State<GroupSettings>,
	containerEl: HTMLElement,
	theme: ObsidianTheme
) => {
	NodeGroups(groupSettings, containerEl);
	ButtonRow(groupSettings, containerEl, theme);
};

const NodeGroups = (groupSettings: State<GroupSettings>, containerEl: HTMLElement) => {
	containerEl.querySelector(".graph-color-groups-container")?.remove();
	const nodeGroupContainerEl = containerEl.createDiv({ cls: "graph-color-groups-container" });
	groupSettings.value.groups.forEach((group, index) => {
		const groupState = groupSettings.createSubState(`value.groups.${index}`, NodeGroup);
		GroupSettingItem(groupState, nodeGroupContainerEl, () => {
			groupSettings.value.groups.splice(index, 1);
		});
	});
};

const ButtonRow = (
	groupSettings: State<GroupSettings>,
	containerEl: HTMLElement,
	theme: ObsidianTheme
) => {
	containerEl.querySelector(".graph-color-button-container")?.remove();
	const buttonContainer = containerEl.createDiv({ cls: "graph-color-button-container" });

	new ButtonComponent(buttonContainer)
		.setClass("mod-cta")
		.setButtonText("Add Group")
		.onClick(() => {
			groupSettings.value.groups.push(new NodeGroup("", theme.textMuted));
			containerEl.empty();
			renderAll(groupSettings, containerEl, theme);
		});

	new ButtonComponent(buttonContainer)
		.setButtonText("Auto-color folders")
		.setTooltip("Generate one color group per top-level folder")
		.onClick(() => {
			const files = (app as any).vault?.getFiles?.() ?? [];
			const folders = new Set<string>();
			files.forEach((f: any) => {
				const parts = f.path.split("/");
				if (parts.length > 1) folders.add(parts[0]);
			});

			const newGroups: NodeGroup[] = [];
			let colorIdx = 0;
			folders.forEach((folder) => {
				const color = FOLDER_COLORS[colorIdx % FOLDER_COLORS.length];
				newGroups.push(new NodeGroup(folder + "/", color));
				colorIdx++;
			});

			groupSettings.value.groups.push(...newGroups);
			containerEl.empty();
			renderAll(groupSettings, containerEl, theme);
		});
};

const GroupSettingItem = (
	group: State<NodeGroup>,
	containerEl: HTMLElement,
	onDelete: () => void
) => {
	const groupEl = containerEl.createDiv({ cls: "graph-color-group" });

	new TextComponent(groupEl).setValue(group.value.query).onChange((value) => {
		group.value.query = value;
	});

	ColorPicker(groupEl, group.value.color, (value) => {
		group.value.color = value;
	});

	new ExtraButtonComponent(groupEl)
		.setIcon("cross")
		.setTooltip("Delete")
		.onClick(onDelete);
};

export default GroupSettingsView;
