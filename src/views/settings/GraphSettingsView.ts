import { TreeItem } from "../atomics/TreeItem";
import DisplaySettingsView from "./categories/DisplaySettingsView";
import LocalGraphSettingsView from "./categories/LocalGraphSettingsView";
import { FilterSettings } from "../../settings/categories/FilterSettings";
import { GroupSettings } from "../../settings/categories/GroupSettings";
import { DisplaySettings } from "../../settings/categories/DisplaySettings";
import { LocalGraphSettings } from "../../settings/categories/LocalGraphSettings";
import { ExtraButtonComponent } from "obsidian";
import State, { StateChange } from "../../util/State";
import EventBus from "../../util/EventBus";
import GroupSettingsView from "./categories/GroupSettingsView";
import FilterSettingsView from "./categories/FilterSettingsView";
import GraphSettings from "src/settings/GraphSettings";
import ObsidianTheme from "src/util/ObsidianTheme";

export class GraphSettingsView extends HTMLDivElement {
	private settingsButton: ExtraButtonComponent;
	private graphControls: HTMLDivElement;
	private readonly settingsState: State<GraphSettings>;
	private readonly theme: ObsidianTheme;
	private readonly isLocalGraph: boolean;

	constructor(settingsState: State<GraphSettings>, theme: ObsidianTheme, isLocalGraph = false) {
		super();
		this.settingsState = settingsState;
		this.theme = theme;
		this.isLocalGraph = isLocalGraph;
	}

	private isCollapsedState = new State(true);
	private callbackUnregisterHandles: (() => void)[] = [];

	async connectedCallback() {
		this.classList.add("graph-settings-view");

		this.settingsButton = new ExtraButtonComponent(this)
			.setIcon("settings")
			.setTooltip("Graph settings")
			.onClick(this.onSettingsButtonClicked);

		this.graphControls = this.createDiv({ cls: "graph-controls" });

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

		this.initListeners();
		this.toggleCollapsed(this.isCollapsedState.value);
	}

	private initListeners() {
		EventBus.on("did-reset-settings", () => {
			this.disconnectedCallback();
			this.connectedCallback();
		});
		this.callbackUnregisterHandles.push(
			this.isCollapsedState.onChange(this.onIsCollapsedChanged)
		);
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

	async disconnectedCallback() {
		this.empty();
		this.callbackUnregisterHandles.forEach((h) => h());
		this.callbackUnregisterHandles.length = 0;
	}
}

if (typeof customElements.get("graph-settings-view") === "undefined") {
	customElements.define("graph-settings-view", GraphSettingsView, { extends: "div" });
}
