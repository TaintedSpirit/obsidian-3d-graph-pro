import { TreeItem } from "../atomics/TreeItem";
import DisplaySettingsView from "./categories/DisplaySettingsView";
import LocalGraphSettingsView from "./categories/LocalGraphSettingsView";
import { FilterSettings } from "../../settings/categories/FilterSettings";
import { GroupSettings } from "../../settings/categories/GroupSettings";
import { DisplaySettings } from "../../settings/categories/DisplaySettings";
import { LocalGraphSettings } from "../../settings/categories/LocalGraphSettings";
import { ExtraButtonComponent, EventRef } from "obsidian";
import State, { StateChange } from "../../util/State";
import EventBus from "../../util/EventBus";
import GroupSettingsView from "./categories/GroupSettingsView";
import FilterSettingsView from "./categories/FilterSettingsView";
import GraphSettings from "src/settings/GraphSettings";
import ObsidianTheme from "src/util/ObsidianTheme";

export class GraphSettingsView {
	public readonly el: HTMLDivElement;

	private settingsButton: ExtraButtonComponent;
	private graphControls!: HTMLDivElement;
	private readonly settingsState: State<GraphSettings>;
	private readonly theme: ObsidianTheme;
	private readonly isLocalGraph: boolean;

	private isCollapsedState = new State(true);
	private callbackUnregisterHandles: (() => void)[] = [];
	private resetRef: EventRef | null = null;

	constructor(settingsState: State<GraphSettings>, theme: ObsidianTheme, isLocalGraph = false) {
		this.settingsState = settingsState;
		this.theme = theme;
		this.isLocalGraph = isLocalGraph;

		this.el = document.createElement("div");
		this.el.classList.add("graph-settings-view");

		this.build();
		this.resetRef = EventBus.on("did-reset-settings", () => this.rebuild());
	}

	private build() {
		this.settingsButton = new ExtraButtonComponent(this.el)
			.setIcon("settings")
			.setTooltip("Graph settings")
			.onClick(this.onSettingsButtonClicked);

		this.graphControls = this.el.createDiv({ cls: "graph-controls" });

		this.appendGraphControlsItems(this.graphControls.createDiv({ cls: "control-buttons" }));

		this.appendSetting(
			this.settingsState.createSubState("value.filters", FilterSettings),
			"Filters",
			FilterSettingsView
		);
		this.appendSetting(
			this.settingsState.createSubState("value.groups", GroupSettings),
			"Groups",
			(...args) => GroupSettingsView(...args, this.theme)
		);
		this.appendSetting(
			this.settingsState.createSubState("value.display", DisplaySettings),
			"Display",
			DisplaySettingsView
		);

		if (this.isLocalGraph) {
			this.appendSetting(
				this.settingsState.createSubState("value.localGraph", LocalGraphSettings),
				"Local Graph",
				LocalGraphSettingsView
			);
		}

		this.callbackUnregisterHandles.push(
			this.isCollapsedState.onChange(this.onIsCollapsedChanged)
		);
		this.toggleCollapsed(this.isCollapsedState.value);
	}

	private rebuild() {
		this.teardown();
		this.el.empty();
		this.isCollapsedState = new State(true);
		this.build();
	}

	private teardown() {
		this.callbackUnregisterHandles.forEach((h) => h());
		this.callbackUnregisterHandles.length = 0;
	}

	private onIsCollapsedChanged = (stateChange: StateChange) => {
		this.toggleCollapsed(stateChange.newValue);
	};

	private toggleCollapsed(collapsed: boolean) {
		if (collapsed) {
			this.settingsButton.setDisabled(false);
			this.graphControls.classList.add("hidden");
		} else {
			this.settingsButton.setDisabled(true);
			this.graphControls.classList.remove("hidden");
		}
	}

	private onSettingsButtonClicked = () => {
		this.isCollapsedState.value = !this.isCollapsedState.value;
	};

	private appendGraphControlsItems(containerEl: HTMLElement) {
		new ExtraButtonComponent(containerEl)
			.setIcon("eraser")
			.setTooltip("Reset to default")
			.onClick(() => EventBus.trigger("do-reset-settings"));

		new ExtraButtonComponent(containerEl)
			.setIcon("x")
			.setTooltip("Close")
			.onClick(() => (this.isCollapsedState.value = true));
	}

	private appendSetting<S>(
		setting: S,
		title: string,
		view: (setting: S, containerEl: HTMLElement) => void
	) {
		const header = document.createElement("header");
		header.classList.add("graph-control-section-header");
		header.textContent = title;
		const item = new TreeItem(header, [(containerEl: HTMLElement) => view(setting, containerEl)]);
		item.classList.add("is-collapsed");
		this.graphControls.append(item);
	}

	public destroy() {
		this.teardown();
		if (this.resetRef) {
			EventBus.offref(this.resetRef);
			this.resetRef = null;
		}
		this.el.empty();
		this.el.remove();
	}
}
